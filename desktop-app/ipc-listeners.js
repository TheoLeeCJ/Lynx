const { ipcMain, dialog, screen } = require("electron");
const path = require("path");
const fsPromises = require("fs").promises;
const {
  messageTypes: {
    REMOTECONTROL_BACK,
    REMOTECONTROL_HOME,
    REMOTECONTROL_RECENTS,
    REMOTECONTROL_TAP,
  },
} = require("./utility/message-types");
const sendJsonMessage = require("./utility/send-json-message");
const makeConnectionInfoQrCode =
    require("./utility/make-connection-info-qr-code");
const createNewScreenstreamWindow =
    require("./screenstream-new-window/create-new-screenstream-window");
const { handleChosenFilesResult } = require("./filetransfer/send");

// ipcMain.handle("get-connection-info-qr-code", () => global.);

ipcMain.once("ready", (event) => {
  event.reply("update-connection-info-qr-code", makeConnectionInfoQrCode());
});

// fullscreen the screen stream?
ipcMain.on("screenstream-fullscreen", (_, deviceAddress) => {
  const device = global.connectedDevices[deviceAddress];

  // if un-fullscreening, set window width and height based on device orientation

  if (device.screenstreamNewWindow.isFullScreen()) {
    device.screenstreamNewWindow.unmaximize();
    device.screenstreamNewWindow.setFullScreen(false);

    const { width, height } = device.prevScreenstreamNewWindowDimensions;
    device.screenstreamNewWindow.setMinimumSize(width, height);
    device.screenstreamNewWindow.setSize(width, height);
  } else {
    const [winWidth, winHeight] = device.screenstreamNewWindow.getSize();
    device.prevScreenstreamNewWindowDimensions = {
      width: winWidth,
      height: winHeight,
    };
    device.screenstreamNewWindow.maximize();
    device.screenstreamNewWindow.setFullScreen(true);
  }
});

// toggle screen stream window
ipcMain.on("screenstream-toggle-window", (_, deviceAddress, windowSetting) => {
  const device = global.connectedDevices[deviceAddress];
  if (windowSetting === "sameWindow") {
    if (device.screenstreamWindow !== null &&
        device.screenstreamWindow === device.screenstreamNewWindow) {
      device.screenstreamNewWindow.close();
      device.screenstreamNewWindow = null;
      device.screenstreamWindow = global.mainWindow;
      device.screenstreamPoppedOut = false;
    }
  } else if (windowSetting === "newWindow") {
    device.screenstreamNewWindow = createNewScreenstreamWindow(deviceAddress);

    device.screenstreamWindow.webContents.send("resize-stream",
        device.deviceMetadata.orientation, {
          width: device.deviceMetadata.screenDimensions.screenWidth,
          height: device.deviceMetadata.screenDimensions.screenHeight,
        });

    device.screenstreamWindow = device.screenstreamNewWindow;
    device.screenstreamPoppedOut = true;
  }
});

// remote control
ipcMain.on("remotecontrol-back", (_, deviceAddress) => {
  sendJsonMessage({ type: REMOTECONTROL_BACK },
      global.connectedDevices[deviceAddress].webSocketConnection);
});

ipcMain.on("remotecontrol-home", (_, deviceAddress) => {
  sendJsonMessage({ type: REMOTECONTROL_HOME },
      global.connectedDevices[deviceAddress].webSocketConnection);
});

ipcMain.on("remotecontrol-recents", (_, deviceAddress) => {
  sendJsonMessage({ type: REMOTECONTROL_RECENTS },
      global.connectedDevices[deviceAddress].webSocketConnection);
});

ipcMain.on("remotecontrol-tap", (_, { xOffsetFactor, yOffsetFactor }, deviceAddress) => {
  const device = global.connectedDevices[deviceAddress];
  const { screenWidth, screenHeight } = device.deviceMetadata.screenDimensions;
  const deviceOrientation = device.deviceMetadata.orientation;

  sendJsonMessage({
    type: REMOTECONTROL_TAP,
    data: {
      x: xOffsetFactor * (deviceOrientation === "portrait" ?
          screenWidth :
          screenHeight),
      y: yOffsetFactor * (deviceOrientation === "portrait" ?
          screenHeight :
          screenWidth),
    },
  }, device.webSocketConnection);
});

ipcMain.handle("filetransfer-choose-files", async (_, deviceAddress) => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"],
    title: `Choose file(s) to send to ${deviceAddress}`,
    buttonLabel: "Send file(s)",
  });

  try {
    const chosenFiles = await Promise.all(filePaths.map(async (filePath) => ({
      filename: path.basename(filePath),
      filePath,
      fileSize: (await fsPromises.stat(filePath)).size,
      transferredSize: 0,
    })));

    global.mainWindow.webContents.send("filetransfer-new-outgoing-files",
        deviceAddress, chosenFiles);
    handleChosenFilesResult(chosenFiles, deviceAddress);

    return chosenFiles;
  } catch (err) {
    console.error(err);
  }
});
