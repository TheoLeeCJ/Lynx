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
      interfaceNames = ["eth0", "wifi0"];
      break;

    default:
      throw new Error("Unsupported OS. Only win32, darwin and linux are supported.");
  }

  for (const interfaceName of interfaceNames) {
    if (Array.isArray(interfaces[interfaceName]) &&
        interfaces[interfaceName].length > 0) {
      return {
        address: interfaces[interfaceName][0].address,
        family: interfaces[interfaceName][0].family,
      };
    }
  }

  throw new Error("No network interfaces available.");
};

module.exports = getLocalIpInfo;
