const { ipcRenderer } = require("electron");
window.ipcRenderer = ipcRenderer;

const queryParams = new URLSearchParams(window.location.search);
window.deviceAddress = queryParams.get("deviceAddress");
window.token = queryParams.get("token");
