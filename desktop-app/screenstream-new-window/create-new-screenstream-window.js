const { app, BrowserWindow, screen, ipcMain } = require("electron");
const path = require("path");
const url = require("url");

const createNewScreenstreamWindow = (deviceAddress) => {
  const primaryDisplayHeight = screen.getPrimaryDisplay().size.height;

  const { imageWidth, imageHeight } = global.connectedDevices[deviceAddress]
      .deviceMetadata.screenstreamImageDimensions;

  let screenstreamNewWindow = new BrowserWindow({
    // BrowserWindow dimensions can only be integers
    width: Math.round(0.9 * primaryDisplayHeight * (imageWidth / imageHeight)),
    height: Math.round(0.9 * primaryDisplayHeight),
    title: `Lynx - Screen stream from ${deviceAddress}`,
    useContentSize: true,
    resizable: false,
    webPreferences: {
      preload: path.join(app.getAppPath(), "screenstream-new-window/preload.js"),
    },
  });

  const newWindowUrl = url.format({
    protocol: "file",
    pathname: `${__dirname}/../webpages/screenstream-new-window.html`,
    query: { // put device info in query params
      deviceAddress,
      token: global.connectedDevices[deviceAddress].token,
    },
  });

  screenstreamNewWindow.loadURL(newWindowUrl);

  screenstreamNewWindow.on("closed", () => {
    // transfer stream back to main window
    global.connectedDevices[deviceAddress].screenstreamWindow = global.mainWindow;
    screenstreamNewWindow = null;

    // tell renderer process that screen stream pop-out window closed
    global.mainWindow.webContents.send("screenstream-new-window-closed",
        deviceAddress);
  });

  return screenstreamNewWindow;
};

module.exports = createNewScreenstreamWindow;
