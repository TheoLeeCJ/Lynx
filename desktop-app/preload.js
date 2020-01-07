const generateQrCode = require("qrcode-generator");
const uuid = require("uuid/v4");
const getLocalIp = require("./utility/get-local-ip");

const connectionUuid = uuid();
window.connectionUuid = connectionUuid;

const qrCode = generateQrCode(0, "H");
qrCode.addData(JSON.stringify({
  ip: getLocalIp(),
  connectionUuid,
}));
qrCode.make();
window.qrCodeDataUrl = qrCode.createDataURL();
