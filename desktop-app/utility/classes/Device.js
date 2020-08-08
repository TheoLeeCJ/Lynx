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
    this.remoteControlEnabled = false;
    this.sendingFiles = false;
    this.receivingFiles = false;
    this.sentFiles = []; // { filename: String, filePath, String }[]
    this.receivedFiles = []; // { filename: String, filePath, String }[]
    this.outgoingFiles = []; // { filename: String, filePath: String, fileSize: Number, transferredSize: Number }[]
    this.incomingFiles = []; // { filename: String, filePath: String, fileSize: Number, transferredSize: Number }[]
    // this.outgoingFile = null; // Number (references an index in outgoingFiles)
    // this.incomingFile = null; // Number (references an index in incomingFiles)
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
