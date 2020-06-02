const { app, BrowserWindow, session, ipcMain } = require("electron");
const uuid = require("uuid").v4;
const path = require("path");
const startWebSocketServer = require("./websocket-server");
const startNewScreenstreamWindow = require("./screenstream-new-window/init");
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

  mainWindow.loadFile("webpages/index.html");

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

// FIXME: IPC listeners below do not support multiple devices yet
/* ---------------------- IPC LISTENERS ---------------------- */

// TODO: 1 new window per device
ipcMain.on("toggle-phone-screen-window", (_, setting) => {
  // if (!global.deviceAuthenticated || !global.screenstreamAuthorised) return;

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
