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
    this.screenstreamPoppedOut = false;
    this.fileTransferInProgress = false;
    this.sentFiles = []; // { filename: String, filePath, String }[]
    this.receivedFiles = []; // { filename: String, filePath, String }[]
    this.currentOutgoingFiles = []; // { filename: String, filePath: String, totalFileSize: Number, transferredSize: Number }[]
    this.currentIncomingFiles = []; // { filename: String, filePath: String, totalFileSize: Number, transferredSize: Number }[]
    this.currentOutgoingFile = null; // Number (references an index in outgoingFiles)
    this.currentIncomingFile = null; // Number (references an index in incomingFiles)
    this.incomingFileBuffer = Buffer.alloc(0);
    this.fileReceiveState = null;
  }

  cleanup() {
    // close new screen stream window if open
    if (this.screenstreamNewWindow instanceof BrowserWindow &&
        !this.screenstreamNewWindow.isDestroyed()) {
      this.screenstreamNewWindow.close();
    }
    this.screenstreamNewWindow = null;

    // add more cleanup operations as necessary
  }

  delete() {
    this.cleanup();
    delete global.connectedDevices[this.address];
  }
}

module.exports = Device;
