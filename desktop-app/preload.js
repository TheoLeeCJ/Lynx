const generateQrCode = require("qrcode-generator");
const uuid = require("uuid/v4");
const getLocalIp = require("./utility/get-local-ip");
const { ipcRenderer } = require("electron");

const connectionUuid = uuid();
window.connectionUuid = connectionUuid;
ipcRenderer.send("get-connection-uuid", connectionUuid);

const qrCode = generateQrCode(0, "H");
qrCode.addData(JSON.stringify({
  ip: getLocalIp(),
  connectionUuid,
}));
qrCode.make();
window.qrCodeDataUrl = qrCode.createDataURL();

window.ipcRenderer = ipcRenderer;
