const { ipcRenderer } = require("electron");
const { dialog } = require("electron").remote;
window.ipcRenderer = ipcRenderer;
window.dialog = dialog;
