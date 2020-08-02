const { app, BrowserWindow, session, ipcMain } = require("electron");
const uuid = require("uuid").v4;
const path = require("path");
const startWebSocketServer = require("./websocket-server");
const sendJsonMessage = require("./utility/send-json-message");

/* ---------------------- APP INIT ---------------------- */

// initialise globals
global.connectedDevices = {};
global.connectionToken = uuid();

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
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.loadFile("webpages/main-window.html");

  global.mainWindow = mainWindow;
  global.screenstreamWindow = mainWindow;
};

app.on("ready", () => {
  createMainWindow();

  // TODO: set CSP header (implement only in production)
  // session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  //   callback({
  //     responseHeaders: {
  //       ...details.responseHeaders,
  //       "Content-Security-Policy": ["script-src 'self'"],
  //     },
  //   });
  // });
});

// initialise IPC listeners
require("./ipc-listeners");
