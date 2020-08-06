// TODO: keep a record of all files sent to & received from each device
// assign a unique UUID to each file
// and keep renderer process updated on the file list

const path = require("path");
const fs = require("fs");
const mime = require("mime");
const sendJsonMessage = require("../utility/send-json-message");
const {
  AUTH_OK,
  GENERIC_OK,
  BAD_REQUEST,
  INVALID_TOKEN,
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
} = require("./../utility/responses");
const {
  messageTypes: {
    GENERIC_MESSAGE,
    FILETRANSFER_TESTRECEIVE,
    FILETRANSFER_BATCH_REQUEST,
    FILETRANSFER_FILE_START,
    FILETRANSFER_FILE_END,
  },
  responseTypes: {
    FILETRANSFER_BATCH_REQUEST_REPLY,
  },
} = require("./../utility/message-types");
const sendRawMessage = require("../utility/send-raw-message");

let filePaths = [];
let receiverDeviceAddresses = []; // make provisions to send files to multiple devices at once?

// ipcMain.on("filetransfer-send", (_, messageData) => {
//   if (messageData.fileDialogResult.canceled) return;

//   // extract filenames from filepaths
//   const filenames = [];
//   filePaths = messageData.fileDialogResult.filePaths;
//   console.log(filePaths);
//   messageData.fileDialogResult.filePaths.forEach((path) => {
//     const pathElements = path.split("\\");
//     filenames.push(pathElements[pathElements.length - 1]);
//   });

//   // send to phone
//   sendJsonMessage({
//     type: FILETRANSFER_BATCH_REQUEST,
//     data: { filenames },
//   }, global.connectedDevices[messageData.deviceAddress].webSocketConnection);

//   receiverDeviceAddresses = [messageData.deviceAddress];
// });

const handleChosenFilesResult = (chosenFiles, deviceAddress) => {
  if (chosenFiles.length === 0) return;

  filePaths = chosenFiles;
  console.log(filePaths);

  const filenames = filePaths.map((filePath) => path.basename(filePath));
  sendJsonMessage({
    type: FILETRANSFER_BATCH_REQUEST,
    data: { filenames },
  }, global.connectedDevices[deviceAddress].webSocketConnection);

  receiverDeviceAddresses = [deviceAddress];
};

const sendFiles = () => {
  try {
    // FIXME: use traditional for loop so device.
    filePaths.forEach((filePath, fileIndex) => {
      // https://stackoverflow.com/questions/25110983/node-reading-file-in-specified-chunk-size
      const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
      const buffer = Buffer.alloc(CHUNK_SIZE);
      const pathElements = filePath.split("\\");
      const filename = pathElements[pathElements.length - 1];

      sendJsonMessage({
        type: FILETRANSFER_FILE_START,
        data: {
          filename,
          fileIndex,
          fileSize: fs.statSync(filePath).size,
          mimeType: mime.getType(filename),
        },
      }, global.connectedDevices[receiverDeviceAddresses[0]].webSocketConnection);

      fs.open(filePath, "r", function(err, fd) {
        if (err) throw err;
        function readNextChunk() {
          fs.read(fd, buffer, 0, CHUNK_SIZE, null, function(err, nread) {
            if (err) throw err;

            if (nread === 0) {
              console.log("Read done");

              // done reading file, do any necessary finalization steps
              sendJsonMessage({
                type: FILETRANSFER_FILE_END,
              }, global.connectedDevices[receiverDeviceAddresses[0]].webSocketConnection);

              fs.close(fd, function(err) {
                if (err) throw err;
              });

              return;
            }

            let data;
            if (nread < CHUNK_SIZE) {
              data = buffer.slice(0, nread);
            } else {
              data = buffer;
            }

            // do something with `data`, then call `readNextChunk();`
            console.log(data.length);

            // readNextChunk will be executed ONLY AFTER THE CURRENT CHUNK HAS BEEN SENT
            sendRawMessage(data, global.connectedDevices[receiverDeviceAddresses[0]].webSocketConnection, readNextChunk);
          });
        }
        readNextChunk();
      });
    });

  } catch (err) {
    console.log(err);
  }
};

module.exports = { handleChosenFilesResult, sendFiles };
