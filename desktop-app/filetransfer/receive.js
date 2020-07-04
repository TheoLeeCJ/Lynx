const fs = require("fs");
const homeDir = require("os").homedir();
let receiveState = false;
let fileBuffer = new Buffer.alloc(0);

const receiveBinaryFileChunk = (fileChunk) => {
  if (receiveState !== false) {
    fileBuffer = Buffer.concat([fileBuffer, fileChunk]);
    console.log("Processed file chunk, size is now " + fileBuffer.length);
  }
};

const setFileReceiveState = (fileReceiveState) => {
  if (fileReceiveState === false) {
    // flush buffer to file
    console.log("Writing file.");
    const writePath = `${homeDir}/Documents/${receiveState.filename}`;
    fs.writeFile(writePath, fileBuffer, function(err) {
      if (err) {
        return console.log(err);
      }
    });
    console.log("File saved as " . writePath);
  }

  // end / if setting up a new file transfer
  fileBuffer = new Buffer.alloc(0);
  receiveState = fileReceiveState;
};

module.exports = { receiveBinaryFileChunk, setFileReceiveState };
