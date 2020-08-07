// TODO: keep a record of all files sent to & received from each device
// assign a unique UUID to each file
// and keep renderer process updated on the file list

const fs = require("fs");
const path = require("path");
const homeDir = require("os").homedir();
const receivedFilesDir = path.join(homeDir, "Documents/Lynx");
const { checkDriveTriggeredFileReceive, passReceivedBuffer } = require("./drive");
// let receiveState = false;
// let fileBuffer = new Buffer.alloc(0);

const receiveBinaryFileChunk = (deviceAddress, fileChunk) => {
  const device = global.connectedDevices[deviceAddress];
  if (device.receiveState !== null) {
    device.incomingFileBuffer = Buffer.concat([device.incomingFileBuffer,
      fileChunk]);
    console.log(`Processed file chunk for ${deviceAddress}, size is now ${device.incomingFileBuffer.length}`);
  }
};

const setFileReceiveState = (deviceAddress, newReceiveState) => {
  console.log(`Receive state for ${deviceAddress}:`, newReceiveState);

  const device = global.connectedDevices[deviceAddress];
  if (newReceiveState === null) {
    // check if can access ~/Documents/Lynx
    // TODO: let user customise where received files are saved
    try {
      fs.accessSync(receivedFilesDir, fs.constants.R_OK | fs.constants.W_OK);
    } catch (err) {
      fs.mkdirSync(receivedFilesDir);
    }

    // flush buffer to file or send to WebDAV drive interface
    console.log(checkDriveTriggeredFileReceive());
    if (checkDriveTriggeredFileReceive()) {
      fs.writeFile(path.join(receivedFilesDir, "temp.png"), Buffer.concat([device.incomingFileBuffer]), (err) => {
        if (err) return console.error(err);
      });
      console.log(checkDriveTriggeredFileReceive() + " file received.");
      passReceivedBuffer(Buffer.concat([device.incomingFileBuffer]));
    } else {
      console.log("Writing file");
      const writePath = path.join(receivedFilesDir, device.receiveState.filename);
      fs.writeFile(writePath, device.incomingFileBuffer, (err) => {
        if (err) return console.error(err);
      });
      console.log(`File saved as ${writePath}`);
  
      device.currentIncomingFiles.findIndex((file) =>
        file.filename === device.receiveState.filename);
    }
  }

  // end / if setting up a new file transfer
  device.incomingFileBuffer = new Buffer.alloc(0);
  device.receiveState = newReceiveState;
};

module.exports = { receiveBinaryFileChunk, setFileReceiveState };
