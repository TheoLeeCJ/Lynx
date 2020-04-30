const generateQrCode = require("qrcode-generator");
const uuid = require("uuid/v4");
const getLocalIp = require("./utility/get-local-ip");
const { ipcRenderer } = require("electron");

const connectionToken = uuid();
window.connectionToken = connectionToken;
ipcRenderer.send("get-connection-token", connectionToken);

const qrCode = generateQrCode(0, "H");
qrCode.addData(JSON.stringify({
  ip: getLocalIp(),
  connectionToken,
}));
qrCode.make();
window.qrCodeDataUrl = qrCode.createDataURL();

window.ipcRenderer = ipcRenderer;
