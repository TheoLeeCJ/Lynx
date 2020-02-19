// update screenstream frame when ipcMain sends message
ipcRenderer.on("update-screenstream-frame", (_, frame) => {
  document.getElementById("screenstream-frame").src =
      `data:image/png;base64,${frame}`;
});
