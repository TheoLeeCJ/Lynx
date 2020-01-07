const { app, BrowserWindow } = require("electron");
const path = require("path");
const startWebSocketServer = require("./websocket-server");

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
};

app.on("ready", createWindow);

startWebSocketServer();
