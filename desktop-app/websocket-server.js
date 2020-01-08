const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 57531 });
const routeMessage = require("./message-router");
const { BAD_REQUEST, INTERNAL_SERVER_ERROR } = require("./utility/responses");
const { responseTypes } = require("./utility/message-types");
const sendJsonMessage = require("./utility/send-json-message");

const startWebSocketServer = () => {
  console.log("Server starting");

  server.on("connection", (ws, req) => {
    ws.on("message", (message) => {
      console.log(`Received message from ${req.socket.remoteAddress}: ${message}`);
      try {
        routeMessage(JSON.parse(message), ws);
      } catch (err) {
        if (err instanceof SyntaxError) { // invalid JSON
          sendJsonMessage({
            type: responseTypes.INITIAL_AUTH_REPLY,
            ...BAD_REQUEST,
          }, ws);
        } else {
          sendJsonMessage({
            type: responseTypes.INITIAL_AUTH_REPLY,
            ...INTERNAL_SERVER_ERROR,
          }, ws);
        }
      }
    });
    ws.on("close", (code, reason) => {
      console.log(`Closed connection to ${req.socket.remoteAddress} with code ${code}. Reason: ${reason}`);
    });
    ws.send("Connection established.");
    console.log(`New connection from ${req.socket.remoteAddress}`);
  });
};

module.exports = startWebSocketServer;
