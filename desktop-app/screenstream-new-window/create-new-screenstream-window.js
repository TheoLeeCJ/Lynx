const { app, BrowserWindow, screen } = require("electron");
const path = require("path");
const url = require("url");

const createNewScreenstreamWindow = (deviceAddress) => {
  const primaryDisplayHeight = screen.getPrimaryDisplay().size.height;

  const device = global.connectedDevices[deviceAddress];
  const { imageWidth, imageHeight } = device.deviceMetadata
      .screenstreamImageDimensions;

  let winWidth;
  let winHeight;
  if (device.deviceMetadata.orientation === "portrait") {
    winWidth = Math.round(0.9 * primaryDisplayHeight * (imageWidth / imageHeight));
    winHeight = Math.round(0.9 * primaryDisplayHeight);
  } else {
    winWidth = Math.round(0.9 * primaryDisplayHeight);
    winHeight = Math.round(0.9 * primaryDisplayHeight * (imageHeight / imageWidth));
  }

  let screenstreamNewWindow = new BrowserWindow({
    // BrowserWindow dimensions can only be integers
    width: winWidth,
    height: winHeight,
    title: `Lynx - Screen stream from ${deviceAddress}`,
    useContentSize: true,
    resizable: false,
    webPreferences: {
      preload: path.join(app.getAppPath(),
          "screenstream-new-window/screenstream-new-window-preload.js"),
    },
  });

  const newWindowUrl = url.format({
    protocol: "file",
    pathname: `${__dirname}/../webpages/screenstream-new-window.html`,
    query: { // put device info in query params
      deviceAddress,
      token: device.token,
    },
  });

  screenstreamNewWindow.loadURL(newWindowUrl);

  screenstreamNewWindow.on("closed", () => {
    // transfer stream back to main window
    device.screenstreamWindow = global.mainWindow;
    screenstreamNewWindow = null;

    // tell renderer process that screen stream pop-out window closed
    global.mainWindow.webContents.send("screenstream-new-window-closed",
        deviceAddress);
  });

  return screenstreamNewWindow;
};

module.exports = createNewScreenstreamWindow;
