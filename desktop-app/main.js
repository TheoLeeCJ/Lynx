const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const startWebSocketServer = require("./websocket-server");

/* ---------------------- APP INIT ---------------------- */

let win;

const createWindow = () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false, // hide before maximise to prevent window frame flash
    webPreferences: {
      preload: path.join(app.getAppPath(), "preload.js"),
    },
  });
  win.on("ready-to-show", win.maximize);

  win.loadFile("webpages/index.html");

  win.on("closed", () => {
    win = null;
  });

  module.exports.win = win;
};

app.on("ready", createWindow);

global.deviceAuthenticated = false;
startWebSocketServer();


/* ---------------------- IPC LISTENERS ---------------------- */

ipcMain.once("get-connection-token", (_, connectionToken) => {
  module.exports.correctToken = connectionToken;
});
