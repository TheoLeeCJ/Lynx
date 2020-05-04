const uuid = require("uuid").v4;
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

const routeMessage = (message, ws, req) => {
  if (typeof message.type !== "string" || !message.type.trim()) {
    sendJsonMessage({ type: INITIAL_AUTH_REPLY, ...BAD_REQUEST }, ws);
  }

  if (message.type !== SCREENSTREAM_FRAME) {
    console.log("Received message:", message);
  } else {
    console.log("Received screen stream frame");
  }

  switch (message.type) {
    case INITIAL_AUTH:
      if (message.data.token === global.connectionToken) {
        global.connectedDevices[req.socket.remoteAddress] = {
          address: req.socket.remoteAddress,
          token: global.connectionToken,
          webSocketConnection: ws,
          screenstreamAuthorised: false,
        };
        sendJsonMessage({ type: INITIAL_AUTH_REPLY, ...AUTH_OK }, ws);

        // send updated devices list (addresses and tokens only) to app window
        require("./main").mainWindow.webContents.send("add-device", {
          address: req.socket.remoteAddress,
          token: global.connectionToken,
        });

        // update connection token
        global.connectionToken = uuid();

        // send new connection info QR code to app window
        require("./main").mainWindow.webContents
            .send("update-connection-info-qr-code", makeConnectionInfoQrCode());
      } else {
        sendJsonMessage({ type: INITIAL_AUTH_REPLY, ...INVALID_TOKEN }, ws);
      }
      break;

    case SCREENSTREAM_REQUEST:
      if (req.socket.remoteAddress in global.connectedDevices) {
        global.connectedDevices[req.socket.remoteAddress]
            .screenstreamAuthorised = true;
        sendJsonMessage({ type: SCREENSTREAM_REQUEST_REPLY, ...GENERIC_OK }, ws);
      } else {
        sendJsonMessage({ type: SCREENSTREAM_REQUEST_REPLY, ...FORBIDDEN }, ws);
      }
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
          require("./main").mainWindow.webContents.send("update-screenstream-frame",
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

    default: // matched no message types - invalid
      sendJsonMessage({ type: GENERIC_MESSAGE_REPLY, ...BAD_REQUEST }, ws);
  }
};

module.exports = routeMessage;
