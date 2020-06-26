const { BrowserWindow } = require("electron");

class Device {
  constructor({ address, token, webSocketConnection }) {
    this.address = address;
    this.token = token;
    this.webSocketConnection = webSocketConnection;

    this.deviceMetadata = null;
    this.screenstreamAuthorised = false;
    this.screenstreamWindow = null;
    this.screenstreamNewWindow = null;
  }

  cleanup() {
    // add more cleanup operations as necessary
    if (this.screenstreamNewWindow instanceof BrowserWindow &&
        !this.screenstreamNewWindow.isDestroyed()) {
      this.screenstreamNewWindow.close();
    }
    this.screenstreamNewWindow = null;
  }

  delete() {
    this.cleanup();
    delete global.connectedDevices[this.address];
  }
}

module.exports = Device;
