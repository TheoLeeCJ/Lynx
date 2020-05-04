const generateQrCode = require("qrcode-generator");
const getLocalIp = require("./get-local-ip");

const makeConnectionInfoQrCode = () => {
  const qrCode = generateQrCode(0, "H");
  qrCode.addData(JSON.stringify({
    ip: getLocalIp(),
    connectionToken: global.connectionToken,
  }));
  qrCode.make();
  return qrCode.createDataURL();
};

module.exports = makeConnectionInfoQrCode;
