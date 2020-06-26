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
    }
  } else if (windowSetting === "newWindow") {
    device.screenstreamNewWindow = createNewScreenstreamWindow(deviceAddress);
    device.screenstreamWindow = device.screenstreamNewWindow;
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

// let invert = false;
// ipcMain.on("orientation-change", (_, orientation) => {
//   console.log("received change in orientation");
//   switch (orientation) {
//     case "portrait":
//       invert = false;
//       break;
//     case "landscape":
//       invert = true;
//       break;
//   }
// });

ipcMain.on("remotecontrol-tap", (_, { xOffsetFactor, yOffsetFactor }, deviceAddress) => {
  const { screenWidth, screenHeight } = global.connectedDevices[deviceAddress]
      .deviceMetadata.screenDimensions;

  sendJsonMessage({
    type: REMOTECONTROL_TAP,
    data: {
      x: xOffsetFactor * screenWidth,
      y: yOffsetFactor * screenHeight,
    },
  }, global.connectedDevices[deviceAddress].webSocketConnection);

  // if (invert) {
  //   sendJsonMessage({
  //     type: REMOTECONTROL_TAP,
  //     data: {
  //       x: xOffsetFactor * screenHeight,
  //       y: yOffsetFactor * screenWidth,
  //     },
  //   }, global.connectedDevices[deviceAddress].webSocketConnection);
  // } else {
  //   sendJsonMessage({
  //     type: REMOTECONTROL_TAP,
  //     data: {
  //       x: xOffsetFactor * screenWidth,
  //       y: yOffsetFactor * screenHeight,
  //     },
  //   }, global.connectedDevices[deviceAddress].webSocketConnection);
  // }
});
