const generateQrCode = require("qrcode-generator");
const getLocalIpInfo = require("./get-local-ip-info");

const makeConnectionInfoQrCode = () => {
  const qrCode = generateQrCode(0, "H");
  qrCode.addData(JSON.stringify({
    ipInfo: getLocalIpInfo(),
    // ipInfo: {
    //   family: "IPv4",
    //   address: "lynx-test.theoleecj.tk",
    // },
    connectionToken: global.connectionToken,
  }));
  qrCode.make();
  return qrCode.createDataURL();
};

module.exports = makeConnectionInfoQrCode;
