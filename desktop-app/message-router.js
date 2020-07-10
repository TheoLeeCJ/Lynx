const uuid = require("uuid").v4;
const { BrowserWindow, dialog } = require("electron");
const { setFileReceiveState } = require("./filetransfer/receive");
const { sendFiles } = require("./filetransfer/send");
const fs = require("fs");
const {
  AUTH_OK,
  GENERIC_OK,
  BAD_REQUEST,
  INVALID_TOKEN,
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
} = require("./utility/responses");
const {
  messageTypes: {
    GENERIC_MESSAGE,
    INITIAL_AUTH,
    SCREENSTREAM_REQUEST,
    SCREENSTREAM_FRAME,
    SCREENSTREAM_ORIENTATIONCHANGE,
    SCREENSTREAM_STOP,
    META_SENDINFO,
    FILETRANSFER_TESTRECEIVE,
    FILETRANSFER_BATCH_REQUEST,
    FILETRANSFER_FILE_START,
    FILETRANSFER_FILE_END,
  },
  responseTypes: {
    GENERIC_MESSAGE_REPLY,
    INITIAL_AUTH_REPLY,
    FILETRANSFER_BATCH_REQUEST_REPLY,
    SCREENSTREAM_REQUEST_REPLY,
    META_SENDINFO_REPLY,
  },
} = require("./utility/message-types");
const sendJsonMessage = require("./utility/send-json-message");
const makeConnectionInfoQrCode = require("./utility/make-connection-info-qr-code");
const Device = require("./utility/classes/Device");

const routeMessage = (message, ws, req) => {
  if (typeof message.type !== "string" || !message.type.trim()) {
    sendJsonMessage({ type: INITIAL_AUTH_REPLY, ...BAD_REQUEST }, ws);
  }

  if (message.type === SCREENSTREAM_FRAME) {
    console.log("Received screen stream frame");
  } else if (message.type === FILETRANSFER_TESTRECEIVE) {
    console.log("Received file");
  } else {
    console.log("Received message:", message);
  }

  switch (message.type) {
    case INITIAL_AUTH:
      if (message.data.token === global.connectionToken) {
        global.connectedDevices[req.socket.remoteAddress] = new Device({
          address: req.socket.remoteAddress,
          token: global.connectionToken,
          webSocketConnection: ws,
        });

        // add device to app window's devices list (addresses and tokens only)
        global.mainWindow.webContents.send("add-device", req.socket.remoteAddress,
            global.connectionToken);

        // update connection token
        global.connectionToken = uuid();

        // send new connection info QR code to app window
        global.mainWindow.webContents.send("update-connection-info-qr-code",
            makeConnectionInfoQrCode());

        sendJsonMessage({ type: INITIAL_AUTH_REPLY, ...AUTH_OK }, ws);
      } else {
        sendJsonMessage({ type: INITIAL_AUTH_REPLY, ...INVALID_TOKEN }, ws);
      }
      break;

    case SCREENSTREAM_REQUEST:
      dialog.showMessageBox(global.mainWindow, {
        title: "A device is asking to share its screen",
        message: `The device at ${req.socket.remoteAddress} is asking to share ` +
                  "its screen and enable remote control features.",
        buttons: ["&Allow", "&Deny"],
        cancelId: 1, // if user presses Esc, "Deny" is automatically selected
        noLink: true, // disable big buttons
      }).then(({ response: clickedButton }) => {
        if (clickedButton === 0) { // user clicked "Allow"
          global.connectedDevices[req.socket.remoteAddress]
              .screenstreamAuthorised = true;
          global.connectedDevices[req.socket.remoteAddress].screenstreamWindow =
              global.mainWindow;
          global.mainWindow.webContents.send("authorise-screenstream",
              req.socket.remoteAddress);

          sendJsonMessage({ type: SCREENSTREAM_REQUEST_REPLY, ...GENERIC_OK }, ws);
        } else {
          sendJsonMessage({ type: SCREENSTREAM_REQUEST_REPLY, ...FORBIDDEN }, ws);
        }
      });
      break;

    case SCREENSTREAM_FRAME:
      if (req.socket.remoteAddress in global.connectedDevices &&
          global.connectedDevices[req.socket.remoteAddress].screenstreamAuthorised) {
        if (message.data && message.data.frame && typeof message.data.frame === "string") {
          // if (global.screenstreamWindow) {
          //   global.screenstreamWindow.webContents
          //       .send("update-screenstream-frame", message.data.frame);
          // } else if (global.screenstreamWindow === null) {
          //   console.error("Could not access window object - global.screenstreamWindow is null.");
          // } else if (typeof global.screenstreamWindow === "undefined") {
          //   console.error("Could not access window object - global.screenstreamWindow is undefined.");
          // }

          global.connectedDevices[req.socket.remoteAddress].screenstreamWindow
              .webContents.send("update-screenstream-frame",
                  req.socket.remoteAddress,
                  message.data.frame);
        } else {
          sendJsonMessage({ type: GENERIC_MESSAGE_REPLY, ...BAD_REQUEST }, ws);
        }
      } else {
        sendJsonMessage({ type: GENERIC_MESSAGE_REPLY, ...FORBIDDEN }, ws);
      }
      break;

    case SCREENSTREAM_STOP:
      global.connectedDevices[req.socket.remoteAddress].screenstreamAuthorised =
          false;
      global.mainWindow.webContents.send("screenstream-stop",
          req.socket.remoteAddress);
      break;

    case META_SENDINFO:
      if (req.socket.remoteAddress in global.connectedDevices) {
        const validateMetadataMessage = require("./utility/validate-metadata-message");
        if (validateMetadataMessage(message)) {
          global.connectedDevices[req.socket.remoteAddress].deviceMetadata =
              message.data;
          sendJsonMessage({ type: META_SENDINFO_REPLY, ...GENERIC_OK }, ws);
        } else {
          sendJsonMessage({ type: META_SENDINFO_REPLY, ...BAD_REQUEST }, ws);
        }
      } else {
        sendJsonMessage({ type: SCREENSTREAM_REQUEST_REPLY, ...FORBIDDEN }, ws);
      }
      break;

    case FILETRANSFER_BATCH_REQUEST:
      // prepare line-break separated list of files to show user
      let prettyFileList = "";
      message.data.filenames.forEach((filename) => {
        prettyFileList += `\n${filename}`;
      });

      // display dialog to request permission
      dialog.showMessageBox(global.mainWindow, {
        title: "A device wants to share files",
        message: `The device at ${req.socket.remoteAddress} is asking to share ` +
                  "these files with you.\n" +
                  prettyFileList,
        buttons: ["&Allow", "&Deny"],
        cancelId: 1, // if user presses Esc, "Deny" is automatically selected
        noLink: true, // disable big buttons
      }).then(({ response: clickedButton }) => {
        if (clickedButton === 0) { // user clicked "Allow"
          sendJsonMessage({ type: FILETRANSFER_BATCH_REQUEST_REPLY, ...GENERIC_OK }, ws);
        } else {
          sendJsonMessage({ type: FILETRANSFER_BATCH_REQUEST_REPLY, ...FORBIDDEN }, ws);
        }
      });
      break;

    case FILETRANSFER_FILE_START:
      setFileReceiveState(message.data);
      break;

    case FILETRANSFER_FILE_END:
      setFileReceiveState(false);
      break;

    case FILETRANSFER_BATCH_REQUEST_REPLY:
      console.log(FILETRANSFER_BATCH_REQUEST_REPLY);
      if (message.success) sendFiles();
      break;

    case SCREENSTREAM_ORIENTATIONCHANGE:
      global.connectedDevices[req.socket.remoteAddress].orientation =
          message.data.orientation;
      global.mainWindow.webContents.send("orientation-change",
          message.data.orientation);
      break;

    default: // matched no message types - invalid
      sendJsonMessage({ type: GENERIC_MESSAGE_REPLY, ...BAD_REQUEST }, ws);
  }
};

module.exports = routeMessage;
