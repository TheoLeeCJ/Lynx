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
  const device = global.connectedDevices[deviceAddress];
  device.outgoingFileIndex = 0;

  await sendCurrentFile(deviceAddress);
};

const sendCurrentFile = async (deviceAddress) => {
  const device = global.connectedDevices[deviceAddress];

  console.log("send current file " + deviceAddress);
  if (device.outgoingFiles.length === 0) {
    device.outgoingFileIndex = null;
    return;
  }

  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
  const buffer = Buffer.alloc(CHUNK_SIZE);

  try {
    const outgoingFile = device.outgoingFiles[0];
    const { filename, filePath } = outgoingFile;
    outgoingFile.fileSize = (await fsPromises.stat(filePath)).size;
    outgoingFile.transferredSize = 0;

    sendJsonMessage({
      type: FILETRANSFER_FILE_START,
      data: {
        filename,
        fileIndex: device.outgoingFileIndex,
        fileSize: outgoingFile.fileSize,
        mimeType: mime.getType(filename),
      },
    }, device.webSocketConnection);

    global.mainWindow.webContents.send("filetransfer-outgoing-file-start",
        deviceAddress, outgoingFile.fileSize);

    console.log(`Reading from ${filePath}`);
    const fileHandle = await fsPromises.open(filePath);
    const readNextChunk = async () => {
      const { bytesRead } = await fileHandle.read(buffer, 0, CHUNK_SIZE, null);
      if (bytesRead === 0) {
        console.log("Read done");

        sendJsonMessage({
          type: FILETRANSFER_FILE_END,
        }, device.webSocketConnection, () => {
          console.log("FILE IS DONE");
          device.sentFiles.push(device.outgoingFiles.shift());
          device.outgoingFileIndex++;
          global.mainWindow.webContents.send("filetransfer-outgoing-file-end",
              deviceAddress);

          sendCurrentFile(deviceAddress);
        });

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

      global.mainWindow.webContents.send("filetransfer-outgoing-file-progress",
          deviceAddress, bytesRead);
    };
    await readNextChunk();
  } catch (err) {
    console.error(err);
  }
};

module.exports = { handleChosenFilesResult, sendFiles };
