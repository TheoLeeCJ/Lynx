const screenstreamFrame = document.getElementById("screenstream-frame");

// update screenstream frame when ipcMain sends message
ipcRenderer.on("update-screenstream-frame", (_, frame) => {
  screenstreamFrame.src = `data:image/png;base64,${frame}`;
});
