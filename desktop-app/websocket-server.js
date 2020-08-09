const WebSocket = require("ws");
const routeMessage = require("./message-router");
const { receiveBinaryFileChunk } = require("./filetransfer/receive");
const { getWebdavIDs, receiveWebdavFileChunk } = require("./filetransfer/drive");
const { BAD_REQUEST, INTERNAL_SERVER_ERROR } = require("./utility/responses");
const {
  responseTypes: {
    GENERIC_MESSAGE_REPLY,
  },
} = require("./utility/message-types");
const sendJsonMessage = require("./utility/send-json-message");
const sendRawMessage = require("./utility/send-raw-message");

const startWebSocketServer = () => {
  const server = new WebSocket.Server({ port: 57531 });
  console.log("Server starting");

  server.on("connection", (ws, req) => {
    ws.on("message", (message) => {
      try {
        // file transfer
        if (typeof message !== "string") {
          const testForFileID = Buffer.from(message, 0, 36);
          if (!getWebdavIDs().includes(testForFileID.toString("utf-8").substring(0, 36))) {
            receiveBinaryFileChunk(req.socket.remoteAddress, message);
          } else {
            receiveWebdavFileChunk(req.socket.remoteAddress, message.subarray(36, message.length));
          }
          return;
        }

        // everything else
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
      global.mainWindow.webContents.send("remove-device", req.socket.remoteAddress,
          global.connectedDevices[req.socket.remoteAddress].token);
      global.connectedDevices[req.socket.remoteAddress].delete();
      console.log(`Closed connection to ${req.socket.remoteAddress} with code ${code}. Reason: ${reason}`);
    });

    console.log(`New connection from ${req.socket.remoteAddress}`);
  });
};

module.exports = startWebSocketServer;
