const { ipcMain } = require("electron");
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

ipcMain.once("ready", (event) => {
  event.reply("update-connection-info-qr-code", makeConnectionInfoQrCode());
});

// toggle screen stream window
ipcMain.on("screenstream-toggle-window", (_, windowSetting, deviceAddress) => {
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
  const { screenWidth, screenHeight } = global.connectedDevices[deviceAddress]
      .deviceMetadata.screenDimensions;
  const deviceOrientation = global.connectedDevices[deviceAddress]
      .deviceMetadata.orientation;

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
  }, global.connectedDevices[deviceAddress].webSocketConnection);
});
