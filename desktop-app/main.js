const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const startWebSocketServer = require("./websocket-server");
const startNewScreenstreamWindow = require("./screenstream-new-window/init");
const {
  messageTypes: {
    REMOTECONTROL_TAP,
  },
} = require("./utility/message-types");
const sendJsonMessage = require("./utility/send-json-message");

/* ---------------------- APP INIT ---------------------- */

// globals
// TODO: use global.connectedDevices to keep track of connection info for multiple devices
global.deviceAuthenticated = false;
global.screenstreamAuthorised = false;
global.webSocketConnections = [];

// start WebSocket server
startWebSocketServer();

// create main window
let mainWindow;

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false, // hide before maximise to prevent window frame flash
    webPreferences: {
      preload: path.join(app.getAppPath(), "main-window-preload.js"),
    },
  });
  mainWindow.on("ready-to-show", mainWindow.maximize);

  mainWindow.loadFile("webpages/index.html");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  global.screenstreamWindow = mainWindow;

  module.exports.mainWindow = mainWindow;
};

app.on("ready", createMainWindow);


/* ---------------------- IPC LISTENERS ---------------------- */

// TODO: for all IPC channels, send and receive deviceIndex as well
// to add support for multiple connections

ipcMain.once("get-connection-token", (_, connectionToken) => {
  module.exports.correctToken = connectionToken;
});

ipcMain.on("toggle-phone-screen-window", (_, setting) => {
  if (!global.deviceAuthenticated || !global.screenstreamAuthorised) return;

  if (setting === "newWindow") {
    startNewScreenstreamWindow();
    global.screenstreamWindow = global.screenstreamNewWindow;
  } else if (setting === "sameWindow") {
    if (global.screenstreamNewWindow) {
      global.screenstreamNewWindow.close();
    }
    global.screenstreamWindow = mainWindow;
  }
});

ipcMain.on("remotecontrol-tap", (_, { xOffsetFactor, yOffsetFactor }) => {
  console.log(xOffsetFactor, yOffsetFactor);
  const { screenWidth, screenHeight } = global.deviceMetadata.screenDimensions;

  sendJsonMessage({
    type: REMOTECONTROL_TAP,
    data: {
      x: xOffsetFactor * screenWidth,
      y: yOffsetFactor * screenHeight,
    },
  }, global.webSocketConnections[0] /* TODO: replace with global.connectedDevices[deviceIndex].webSocketConnection */);
});
