const { app, BrowserWindow, screen } = require("electron");
const path = require("path");

let screenstreamWindow;

const startScreenStreamWindow = () => {
  const { imageWidth, imageHeight } = global.deviceMetadata
      .screenStreamImageDimensions;

  screenstreamWindow = new BrowserWindow({
    width: imageWidth,
    height: imageHeight,
    useContentSize: true,
    resizable: false,
    webPreferences: {
      preload: path.join(app.getAppPath(), "screenstream/screenstream-window-preload.js"),
    },
  });

  screenstreamWindow.loadFile("webpages/screenstream-window.html");

  screenstreamWindow.on("closed", () => {
    screenstreamWindow = null;
  });

  module.exports.screenstreamWindow = screenstreamWindow;
};

module.exports = { startScreenStreamWindow };
