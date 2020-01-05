const getLocalIp = () => {
  const interfaces = require("os").networkInterfaces();
  const interfaceInfoArray = Object.values(interfaces).flat();
  return interfaceInfoArray
      .find(({ family, address }) => family === "IPv4" && address !== "127.0.0.1")
      .address;
};

const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 8080 });

console.log("Server starting");

server.on("connection", (ws, req) => {
  ws.on("message", (message) => {
    console.log(`Received message from ${req.connection.remoteAddress}: ${message}`);
  });
  ws.send("Connection established.");
  console.log(`New connection from ${req.connection.remoteAddress}`);
});


