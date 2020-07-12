const fs = require("fs");
const homeDir = require("os").homedir();
let receiveState = false;
let fileBuffer = new Buffer.alloc(0);

const receiveBinaryFileChunk = (fileChunk) => {
  if (receiveState !== false) {
    fileBuffer = Buffer.concat([fileBuffer, fileChunk]);
    console.log(`Processed file chunk, size is now ${fileBuffer.length}`);
  }
};

const setFileReceiveState = (fileReceiveState) => {
  if (fileReceiveState === false) {
    // check if can access ~/Documents/Lynx
    // we should allow the user to choose which folder to save these to in the future
    try {
      fs.accessSync(`${homeDir}/Documents/Lynx/`, fs.constants.R_OK | fs.constants.W_OK);
    } catch (err) {
      fs.mkdirSync(`${homeDir}/Documents/Lynx/`);
    }

    // flush buffer to file
    console.log("Writing file");
    const writePath = `${homeDir}/Documents/Lynx/${receiveState.filename}`;
    fs.writeFile(writePath, fileBuffer, (err) => {
      if (err) return console.error(err);
    });
    console.log(`File saved as ${writePath}`);
  }

  // end / if setting up a new file transfer
  fileBuffer = new Buffer.alloc(0);
  receiveState = fileReceiveState;
};

module.exports = { receiveBinaryFileChunk, setFileReceiveState };
