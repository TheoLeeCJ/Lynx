const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 57531 });
const routeMessage = require("./message-router");
const { BAD_REQUEST, INTERNAL_SERVER_ERROR } = require("./utility/responses");

const startWebSocketServer = () => {
  console.log("Server starting");

  server.on("connection", (ws, req) => {
    ws.on("message", (message) => {
      console.log(`Received message from ${req.socket.remoteAddress}: ${message}`);
      try {
        routeMessage(JSON.parse(message), ws);
      } catch (err) {
        if (err instanceof SyntaxError) {
          ws.send(JSON.stringify(BAD_REQUEST));
        } else {
          ws.send(JSON.stringify(INTERNAL_SERVER_ERROR));
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
