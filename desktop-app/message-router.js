const uuid = require("uuid").v4;
const { dialog } = require("electron");
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
    META_SENDINFO,
    FILETRANSFER_TESTRECEIVE,
    ORIENTATION_CHANGE,
  },
  responseTypes: {
    GENERIC_MESSAGE_REPLY,
    INITIAL_AUTH_REPLY,
    SCREENSTREAM_REQUEST_REPLY,
    META_SENDINFO_REPLY,
  },
} = require("./utility/message-types");
const sendJsonMessage = require("./utility/send-json-message");
const makeConnectionInfoQrCode = require("./utility/make-connection-info-qr-code");
const fs = require("fs");

const routeMessage = (message, ws, req) => {
  if (typeof message.type !== "string" || !message.type.trim()) {
    sendJsonMessage({ type: INITIAL_AUTH_REPLY, ...BAD_REQUEST }, ws);
  }

  if (message.type == SCREENSTREAM_FRAME) {
    console.log("Received screen stream frame");
  }
  else if (message.type == FILETRANSFER_TESTRECEIVE) {
    console.log("Received file");
  }
  else {
    console.log("Received message:", message);
  }

  switch (message.type) {
    case INITIAL_AUTH:
      if (message.data.token === global.connectionToken) {
        global.connectedDevices[req.socket.remoteAddress] = {
          address: req.socket.remoteAddress,
          token: global.connectionToken,
          webSocketConnection: ws,
          deviceMetadata: null,
          screenstreamAuthorised: false,
        };

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
          global.mainWindow.webContents.send("allow-screenstream",
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

          // TODO: each device can have its own pop-out window for screen stream
          global.mainWindow.webContents.send("update-screenstream-frame",
              req.socket.remoteAddress,
              global.connectedDevices[req.socket.remoteAddress].token,
              message.data.frame);
        } else {
          sendJsonMessage({ type: GENERIC_MESSAGE_REPLY, ...BAD_REQUEST }, ws);
        }
      } else {
        sendJsonMessage({ type: GENERIC_MESSAGE_REPLY, ...FORBIDDEN }, ws);
      }
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

    // insecure, ugly code by me (Theo)
    // it is all inline now, just for testing purposes. ideally it should go into a separate file.
    case FILETRANSFER_TESTRECEIVE:
      let home = require("os").homedir();
      let path = home + '/Documents/' + message.data.fileName;

      let binaryData = new Buffer(message.data.fileContent, 'base64').toString('binary');

      fs.writeFile(path, binaryData, "binary", function (err) {
        // console.log(err);
      });

      break;
    // end insecure ugly code by me (Theo)
    case ORIENTATION_CHANGE:
      global.mainWindow.webContents.send("orientation-change", message.data.orientation);
      break;
    default: // matched no message types - invalid
      sendJsonMessage({ type: GENERIC_MESSAGE_REPLY, ...BAD_REQUEST }, ws);
  }
};

module.exports = routeMessage;
