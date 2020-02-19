const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const startWebSocketServer = require("./websocket-server");
const startNewScreenstreamWindow =
    require("./screenstream-new-window/screenstream-new-window-init");

/* ---------------------- APP INIT ---------------------- */

let mainWindow;

const createWindow = () => {
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

app.on("ready", createWindow);

global.deviceAuthenticated = false;
global.screenstreamAuthorised = false;

startWebSocketServer();


/* ---------------------- IPC LISTENERS ---------------------- */

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
