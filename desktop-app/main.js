const { app, BrowserWindow } = require("electron");

let win;

const createWindow = () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false, // hide before maximise to prevent window frame flash
  });
  win.on("ready-to-show", win.maximize);

  win.loadFile("index.html");

  win.on("closed", () => {
    win = null;
  });
};

app.on("ready", createWindow);
