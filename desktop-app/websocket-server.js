const WebSocket = require("ws");
const routeMessage = require("./message-router");
const { BAD_REQUEST, INTERNAL_SERVER_ERROR } = require("./utility/responses");
const {
  responseTypes: {
    GENERIC_MESSAGE_REPLY,
  },
} = require("./utility/message-types");
const sendJsonMessage = require("./utility/send-json-message");

const startWebSocketServer = () => {
  const server = new WebSocket.Server({ port: 57531 });
  console.log("Server starting");

  server.on("connection", (ws, req) => {
    ws.on("message", (message) => {
      try {
        routeMessage(JSON.parse(message), ws, req);
      } catch (err) {
        if (err instanceof SyntaxError) { // invalid JSON
          sendJsonMessage({ type: GENERIC_MESSAGE_REPLY, ...BAD_REQUEST }, ws);
        } else {
          sendJsonMessage({ type: GENERIC_MESSAGE_REPLY, ...INTERNAL_SERVER_ERROR }, ws);
        }
      }
    });
    ws.on("close", (code, reason) => {
      delete global.connectedDevices[req.socket.remoteAddress];
      console.log(`Closed connection to ${req.socket.remoteAddress} with code ${code}. Reason: ${reason}`);
    });
    // ws.send("Connection established.");
    console.log(`New connection from ${req.socket.remoteAddress}`);
  });
};

module.exports = startWebSocketServer;
