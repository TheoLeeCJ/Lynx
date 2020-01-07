const getLocalIp = () => {
  const interfaces = require("os").networkInterfaces();
  const interfaceInfoArray = Object.values(interfaces).flat();
  return interfaceInfoArray
      .find(({ family, address }) => family === "IPv4" && address !== "127.0.0.1")
      .address;
};

module.exports = getLocalIp;
