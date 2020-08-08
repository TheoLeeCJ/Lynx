const path = require("path");
const fsPromises = require("fs").promises;
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

  const device = global.connectedDevices[deviceAddress];
  device.outgoingFiles = device.outgoingFiles.concat(chosenFiles);

  const filenames = chosenFiles.map(({ filename }) => filename);
  sendJsonMessage({
    type: FILETRANSFER_BATCH_REQUEST,
    data: { filenames },
  }, device.webSocketConnection);
};

const sendFiles = async (deviceAddress) => {
  try {
    const device = global.connectedDevices[deviceAddress];

    let fileIndex = 0;
    while (device.outgoingFiles.length > 0) {
      const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
      const buffer = Buffer.alloc(CHUNK_SIZE);

      const outgoingFile = device.outgoingFiles[0];
      const { filename, filePath } = outgoingFile;
      outgoingFile.fileSize = (await fsPromises.stat(filePath)).size;
      outgoingFile.transferredSize = 0;

      sendJsonMessage({
        type: FILETRANSFER_FILE_START,
        data: {
          filename,
          fileIndex,
          fileSize: outgoingFile.fileSize,
          mimeType: mime.getType(filename),
        },
      }, device.webSocketConnection);

      try {
        console.log(`Reading from ${filePath}`);
        const fileHandle = await fsPromises.open(filePath);
        const readNextChunk = async () => {
          const { bytesRead } = await fileHandle.read(buffer, 0, CHUNK_SIZE, null);
          if (bytesRead === 0) {
            console.log("Read done");
            sendJsonMessage({
              type: FILETRANSFER_FILE_END,
            }, device.webSocketConnection);

            await fileHandle.close();
            return;
          }

          let data;
          if (bytesRead < CHUNK_SIZE) {
            data = buffer.slice(0, bytesRead);
          } else {
            data = buffer;
          }
          console.log(data.length);
          sendRawMessage(data, device.webSocketConnection, readNextChunk);
          outgoingFile.transferredSize += bytesRead;
        };
        await readNextChunk();
      } catch (err) {
        console.error(err);
      }

      device.sentFiles.push(device.outgoingFiles.shift());
      fileIndex++;
    }

    // device.outgoingFiles.forEach((outgoingFile, fileIndex) => {
    //   const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
    //   const buffer = Buffer.alloc(CHUNK_SIZE);

    //   const { filename, filePath } = outgoingFile;
    //   outgoingFile.fileSize = fs.statSync(filePath).size;
    //   outgoingFile.transferredSize = 0;

    //   sendJsonMessage({
    //     type: FILETRANSFER_FILE_START,
    //     data: {
    //       filename,
    //       fileIndex,
    //       fileSize: outgoingFile.fileSize,
    //       mimeType: mime.getType(filename),
    //     },
    //   }, device.webSocketConnection);

    //   fs.open(filePath, "r", function(err, fd) {
    //     console.log(`Reading from ${filePath}`);
    //     if (err) throw err;
    //     function readNextChunk() {
    //       fs.read(fd, buffer, 0, CHUNK_SIZE, null, function(err, nread) {
    //         if (err) throw err;

    //         if (nread === 0) {
    //           console.log("Read done");

    //           // TODO: remove first element of device.outgoingFiles and add to device.sentFiles

    //           // done reading file, do any necessary finalization steps
    //           sendJsonMessage({
    //             type: FILETRANSFER_FILE_END,
    //           }, device.webSocketConnection);

    //           fs.close(fd, function(err) {
    //             if (err) throw err;
    //           });

    //           return;
    //         }

    //         let data;
    //         if (nread < CHUNK_SIZE) {
    //           data = buffer.slice(0, nread);
    //         } else {
    //           data = buffer;
    //         }

    //         // do something with `data`, then call `readNextChunk();`
    //         console.log(data.length);

    //         // readNextChunk will be executed ONLY AFTER THE CURRENT CHUNK HAS BEEN SENT
    //         sendRawMessage(data, device.webSocketConnection, readNextChunk);
    //       });
    //     }
    //     readNextChunk();
    //   });
    // });
  } catch (err) {
    console.log(err);
  }
};

module.exports = { handleChosenFilesResult, sendFiles };
