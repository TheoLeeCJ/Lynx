const getLocalIpInfo = () => {
  const interfaces = require("os").networkInterfaces();

  let interfaceNames;
  switch (process.platform) {
    case "win32":
      interfaceNames = ["Ethernet", "Wi-Fi"];
      break;

    case "darwin":
      interfaceNames = ["en0", "en1", "fw0"];
      break;

    case "linux":
      interfaceNames = ["eth0", "wlan0", "wifi0"];
      break;

    default:
      throw new Error("Unsupported OS. Only win32, darwin and linux are supported.");
  }

  for (const interfaceName of interfaceNames) {
    if (Array.isArray(interfaces[interfaceName])) {
      for (const interface of interfaces[interfaceName]) {
        if (!interface.internal) {
          return {
            address: interface.address,
            family: interface.family,
          };
        }
      }
    }
  }

  throw new Error("No network interfaces available.");
};

module.exports = getLocalIpInfo;
