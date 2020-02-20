const { app, BrowserWindow, screen } = require("electron");
const path = require("path");

let screenstreamNewWindow;

const startNewScreenstreamWindow = () => {
  const primaryDisplayHeight = screen.getPrimaryDisplay().size.height;

  const { imageWidth, imageHeight } = global.deviceMetadata
      .screenstreamImageDimensions;

  screenstreamNewWindow = new BrowserWindow({
    width: Math.round(0.9 * primaryDisplayHeight * (imageWidth / imageHeight)),
    height: Math.round(0.9 * primaryDisplayHeight),
    useContentSize: true,
    resizable: false,
    webPreferences: {
      preload: path.join(app.getAppPath(), "screenstream-new-window/preload.js"),
    },
  });

  screenstreamNewWindow.loadFile("webpages/screenstream-new-window.html");

  screenstreamNewWindow.on("closed", () => {
    // transfer stream back to main window if user manually closes new window
    const { mainWindow } = require("../main");
    if (mainWindow) {
      global.screenstreamWindow = mainWindow;
    } else if (mainWindow === null) {
      console.error("mainWindow is null. This should never happen.");
    } else if (typeof mainWindow === "undefined") {
      console.error("mainWindow is undefined. This should never happen.");
    } else {
      console.error("mainWindow is not null or undefined, but is falsy. " +
                    "This should never happen.");
    }

    screenstreamNewWindow = null;
  });

  global.screenstreamNewWindow = screenstreamNewWindow;
};

module.exports = startNewScreenstreamWindow;
