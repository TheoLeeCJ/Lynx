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
    console.log(`Received message from ${req.socket.remoteAddress}: ${message}`);
  });
  ws.on("close", (code, reason) => {
    console.log(`Closed connection to ${req.socket.remoteAddress} with code ${code}. Reason: ${reason}`);
  });
  ws.send("Connection established.");
  console.log(`New connection from ${req.socket.remoteAddress}`);
});

/*

----------------------- MESSAGE SCHEMA -----------------------
{
  type: "info" | "alert" | "error" | "screenshare-request" | "screenshare-data",
  data: {
    message?: string, // for all stuff except screenshare things
    screenshareVerificationCode?: string, // for screenshare-request
    screenshareImage?: string // for screenshare-data
  }
}

*/
