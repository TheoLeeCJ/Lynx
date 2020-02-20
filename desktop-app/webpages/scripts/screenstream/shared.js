const screenstreamFrame = document.getElementById("screenstream-frame");

// TODO: for all IPC channels, send and receive deviceIndex as well
// to add support for multiple connections

// update screenstream frame when ipcMain sends message
ipcRenderer.on("update-screenstream-frame", (_, frame) => {
  screenstreamFrame.src = `data:image/png;base64,${frame}`;
});

screenstreamFrame.addEventListener("click", ({ offsetX, offsetY }) => {
  const imageRect = screenstreamFrame.getBoundingClientRect();
  const imageWidth = imageRect.width;
  const imageHeight = imageRect.height;

  ipcRenderer.send("remotecontrol-tap", {
    xOffsetFactor: offsetX / imageWidth,
    yOffsetFactor: offsetY / imageHeight,
  });
});
