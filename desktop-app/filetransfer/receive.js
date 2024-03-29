const fs = require("fs");
const path = require("path");
const homeDir = require("os").homedir();
const receivedFilesDir = path.join(homeDir, "Documents/Lynx");
// let receiveState = false;
// let fileBuffer = new Buffer.alloc(0);

const receiveBinaryFileChunk = (deviceAddress, fileChunk) => {
  const device = global.connectedDevices[deviceAddress];
  if (device.fileReceiveState !== null) {
    device.incomingFileBuffer = Buffer.concat([device.incomingFileBuffer,
      fileChunk]);

    const numBytesReceived = fileChunk.length;
    device.incomingFiles[0].transferredSize += numBytesReceived;
    global.mainWindow.webContents.send("filetransfer-incoming-file-progress",
        deviceAddress, numBytesReceived);
    console.log(`Processed file chunk for ${deviceAddress}, size is now ${device.incomingFileBuffer.length}`);
  }
};

const setFileReceiveState = (deviceAddress, newFileReceiveState) => {
  console.log(`Receive state for ${deviceAddress}:`, newFileReceiveState);

  const device = global.connectedDevices[deviceAddress];
  if (device.fileReceiveState === null && newFileReceiveState !== null) {
    // start of next incoming file
    if (newFileReceiveState.filename !== device.incomingFiles[0].filename) {
      throw Error(`Device at ${deviceAddress} sent a different file from what was previously specified in the request. Expected ${device.incomingFiles[0]}, got ${newFileReceiveState.filename}.`);
    }
    const incomingFile = device.incomingFiles[0];
    incomingFile.fileSize = newFileReceiveState.fileSize;

    device.receivingFiles = true;
    global.mainWindow.webContents.send("filetransfer-incoming-file-start",
        deviceAddress, incomingFile.fileSize);
  } else if (newFileReceiveState === null) {
    // check if can access ~/Documents/Lynx
    // TODO: let user customise where received files are saved
    try {
      fs.accessSync(receivedFilesDir, fs.constants.R_OK | fs.constants.W_OK);
    } catch (err) {
      fs.mkdirSync(receivedFilesDir);
    }

    // flush buffer to file or send to WebDAV drive interface
    console.log("Writing file");
    const writePath = path.join(receivedFilesDir, device.fileReceiveState
        .filename);
    console.log("writePath:", writePath);
    fs.writeFile(writePath, device.incomingFileBuffer, (err) => {
      if (err) return console.error(err);
    });
    console.log(`File saved as ${writePath}`);

    device.receivedFiles.push(device.incomingFiles.shift());
    global.mainWindow.webContents.send("filetransfer-incoming-file-end",
        deviceAddress);
  }

  // end / if setting up a new file transfer
  device.incomingFileBuffer = Buffer.alloc(0);
  device.fileReceiveState = newFileReceiveState;
  device.receivingFiles = false;
};

module.exports = { receiveBinaryFileChunk, setFileReceiveState };
