const { BrowserWindow } = require("electron");
const { shutdownPhoneDriveServer } = require("./../../filetransfer/drive");

class Device {
  constructor({ address, token, webSocketConnection }) {
    this.address = address;
    this.token = token;
    this.webSocketConnection = webSocketConnection;

    this.deviceMetadata = null;
    this.screenstreamAuthorised = false;
    this.screenstreamWindow = null;
    this.screenstreamNewWindow = null;
    this.screenstreamPoppedOut = false;
  }

  cleanup() {
    // close new screen stream window if open
    if (this.screenstreamNewWindow instanceof BrowserWindow &&
        !this.screenstreamNewWindow.isDestroyed()) {
      this.screenstreamNewWindow.close();
    }
    this.screenstreamNewWindow = null;

    // shutdown the phone's WebDAV server / drive
    shutdownPhoneDriveServer(this.address);

    // add more cleanup operations as necessary
  }

  delete() {
    this.cleanup();
    delete global.connectedDevices[this.address];
  }
}

module.exports = Device;
