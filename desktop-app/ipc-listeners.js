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
const makeConnectionInfoQrCode = require("./utility/make-connection-info-qr-code");

ipcMain.once("ready", (event) => {
  event.sender.send("update-connection-info-qr-code",
      makeConnectionInfoQrCode());
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
let invert = false;
ipcMain.on("orientation-change", (_, orient) => {
  console.log("received change in orientation");
  switch(orient){
    case "portrait":
      invert = false;
      break;
    case "landscape":
      invert = true;
      break;
  }
});
ipcMain.on("remotecontrol-tap", (_, { xOffsetFactor, yOffsetFactor }, deviceIpAddress) => {
  const { screenWidth, screenHeight } = global.connectedDevices[deviceIpAddress]
      .deviceMetadata.screenDimensions;
  if(invert){
    sendJsonMessage({
      type: REMOTECONTROL_TAP,
      data: {
        x: xOffsetFactor * screenHeight,
        y: yOffsetFactor * screenWidth,
      },
    }, global.connectedDevices[deviceIpAddress].webSocketConnection);
  }else{
    sendJsonMessage({
      type: REMOTECONTROL_TAP,
      data: {
        x: xOffsetFactor * screenWidth,
        y: yOffsetFactor * screenHeight,
      },
    }, global.connectedDevices[deviceIpAddress].webSocketConnection);
  }
});
