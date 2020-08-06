// Device class for renderer process
class Device {
  constructor({ address, token }) {
    this.address = address;
    this.token = token;

    this.screenstreamAuthorised = false;
    this.screenstreamInProgress = false;
    this.screenstreamPoppedOut = false;
    this.screenstreamControlsShown = true;
    this.fileTransferInProgress = false;
    this.sentFiles = []; // { filename: String, filePath, String }[]
    this.receivedFiles = []; // { filename: String, filePath, String }[]
    this.currentOutgoingFiles = []; // { filename: String, filePath: String, totalFileSize: Number, transferredSize: Number }[]
    this.currentIncomingFiles = []; // { filename: String, filePath: String, totalFileSize: Number, transferredSize: Number }[]
    this.outgoingBatchSize = 0; // Number
    this.incomingBatchSize = 0; // Number
    this.currentOutgoingFile = null; // Number (out of batch size - is not an index)
    this.currentIncomingFile = null; // Number (out of batch size - is not an index)
  }
}
