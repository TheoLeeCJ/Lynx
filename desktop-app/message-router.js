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
const { startScreenStreamWindow } = require("./screenstream/screenstream-window");

let screenstreamWindow;

const routeMessage = (message, ws) => {
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
      if (message.data.token === require("./main").correctToken) {
        global.deviceAuthenticated = true;
        sendJsonMessage({ type: INITIAL_AUTH_REPLY, ...AUTH_OK }, ws);
      } else {
        sendJsonMessage({ type: INITIAL_AUTH_REPLY, ...INVALID_TOKEN }, ws);
      }
      break;

    case SCREENSTREAM_REQUEST:
      if (global.deviceAuthenticated) {
        global.screenstreamAuthorised = true;
        sendJsonMessage({ type: SCREENSTREAM_REQUEST_REPLY, ...GENERIC_OK }, ws);
      } else {
        sendJsonMessage({ type: SCREENSTREAM_REQUEST_REPLY, ...FORBIDDEN }, ws);
      }
      break;

    case SCREENSTREAM_FRAME:
      if (global.deviceAuthenticated && global.screenstreamAuthorised) {
        if (message.data && message.data.frame && typeof message.data.frame === "string") {
          if (screenstreamWindow) {
            screenstreamWindow.webContents.send("update-screenstream-frame", message.data.frame);
          } else if (screenstreamWindow === null) {
            console.log("Could not access window object - win is null. Window possibly closed.");
          } else if (typeof screenstreamWindow === "undefined") {
            console.log("Could not access window object - screenstreamWindow is undefined. " +
                        "Window object probably not present in exports from screenstream/screenstream-window.js " +
                        "(startScreenStreamWindow did not run).");
          }
        } else {
          sendJsonMessage({ type: GENERIC_MESSAGE_REPLY, ...BAD_REQUEST }, ws);
        }
      } else {
        sendJsonMessage({ type: GENERIC_MESSAGE_REPLY, ...FORBIDDEN }, ws);
      }
      break;

    case META_SENDINFO:
      if (global.deviceAuthenticated) {
        const validateMetadataMessage = require("./utility/validate-metadata-message");
        if (validateMetadataMessage(message)) {
          global.deviceMetadata = message.data;
          sendJsonMessage({ type: META_SENDINFO_REPLY, ...GENERIC_OK }, ws);

          startScreenStreamWindow();
          screenstreamWindow = require("./screenstream/screenstream-window").screenstreamWindow;
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
