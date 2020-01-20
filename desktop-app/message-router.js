const {
  AUTH_OK,
  GENERIC_OK,
  BAD_REQUEST,
  INVALID_TOKEN,
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
} = require("./utility/responses");
const { messageTypes, responseTypes } = require("./utility/message-types");
const sendJsonMessage = require("./utility/send-json-message");

const routeMessage = (message, ws) => {
  if (typeof message.type !== "string" || !message.type.trim()) {
    sendJsonMessage({
      type: responseTypes.INITIAL_AUTH_REPLY,
      ...BAD_REQUEST,
    }, ws);
  }

  switch (message.type) {
    case messageTypes.INITIAL_AUTH:
      const { correctToken } = require("./main.js");
      if (message.data.token === correctToken) {
        sendJsonMessage({
          type: responseTypes.INITIAL_AUTH_REPLY,
          ...AUTH_OK,
        }, ws);
      } else {
        sendJsonMessage({
          type: responseTypes.INITIAL_AUTH_REPLY,
          ...INVALID_TOKEN,
        }, ws);
      }
      break;

    default: // matched no message types - invalid
      sendJsonMessage({
        type: responseTypes.INITIAL_AUTH_REPLY,
        ...BAD_REQUEST,
      }, ws);
  }
};

module.exports = routeMessage;
