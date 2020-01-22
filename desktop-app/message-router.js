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
    INITIAL_AUTH,
    SCREENSTREAM_FRAME,
  },
  responseTypes: {
    INITIAL_AUTH_REPLY,
    GENERIC_MESSAGE_REPLY,
  },
} = require("./utility/message-types");
const sendJsonMessage = require("./utility/send-json-message");

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
      const { correctToken } = require("./main");
      if (message.data.token === correctToken) {
        sendJsonMessage({ type: INITIAL_AUTH_REPLY, ...AUTH_OK }, ws);
        global.deviceAuthenticated = true;
      } else {
        sendJsonMessage({ type: INITIAL_AUTH_REPLY, ...INVALID_TOKEN }, ws);
      }
      break;

    case SCREENSTREAM_FRAME:
      if (global.deviceAuthenticated && message.data.frame) {
        const { win } = require("./main");
        if (win === null) {
          console.log("Could not access window object - win is null. Window possibly closed.");
        } else if (typeof win === "undefined") {
          console.log("Could not access window object - win is undefined.");
        }

        win.webContents.send("update-screenstream-frame", message.data.frame);
      } else if (!global.deviceAuthenticated) {
        // screenstream request not implemented yet
        // sendJsonMessage({ type: SCREENSTREAM_REQUEST_REPLY, ...FORBIDDEN }, ws);
      }
      break;

    default: // matched no message types - invalid
      sendJsonMessage({ type: GENERIC_MESSAGE_REPLY, ...BAD_REQUEST }, ws);
  }
};

module.exports = routeMessage;
