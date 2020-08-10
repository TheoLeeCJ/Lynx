// Device class for renderer process
class Device {
  constructor({ address, token, deviceName }) {
    this.address = address;
    this.token = token;
    this.deviceMetadata = { deviceName };

    this.screenstreamAuthorised = false;
    this.screenstreamInProgress = false;
    this.screenstreamPoppedOut = false;
    this.screenstreamControlsShown = true;
    this.remoteControlEnabled = false;
    this.sendingFiles = false;
    this.receivingFiles = false;
    this.sentFiles = []; // { filename: String, filePath, String }[]
    this.receivedFiles = []; // { filename: String, filePath, String }[]
    this.outgoingFiles = []; // { filename: String, filePath: String, fileSize: Number, transferredSize: Number }[]
    this.incomingFiles = []; // { filename: String, filePath: String, fileSize: Number, transferredSize: Number }[]
    this.outgoingFilesBatchSize = 0; // Number
    this.incomingFilesBatchSize = 0; // Number
    this.outgoingFileNumber = 0; // Number (out of batch size - is not an index)
    this.incomingFileNumber = 0; // Number (out of batch size - is not an index)
  }

  cleanup() {
    document.getElementById(`device-${this.token}`).remove();
    // TODO: if device currently selected, display "No device selected" screen
  }

  delete() {
    this.cleanup();
    delete window.connectedDevices[this.address];
  }
}
