const {
  AUTH_OK,
  GENERIC_OK,
  BAD_REQUEST,
  INVALID_TOKEN,
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
} = require("./utility/responses");

const routeMessage = (message, ws) => {
  if (typeof message.type !== "string" || !message.type.trim()) {
    ws.send(BAD_REQUEST);
  }

  switch (message.type) {
    case "initial_auth":
      const { correctToken } = require("./main.js");
      if (message.data.token === correctToken) {
        ws.send(JSON.stringify(AUTH_OK));
      } else {
        ws.send(JSON.stringify(INVALID_TOKEN));
      }
      break;
    default:
      // .
  }
};

module.exports = routeMessage;
