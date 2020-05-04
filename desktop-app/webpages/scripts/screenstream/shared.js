// const screenstreamFrame = document.getElementById("screenstream-frame");

// update screenstream frame when ipcMain sends message
ipcRenderer.on("update-screenstream-frame", (_, deviceToken, frame) => {
  console.log(deviceToken);
  const screenstreamFrame =
      document.querySelector(`#device-${deviceToken} .screenstream-frame`);
  screenstreamFrame.src = `data:image/png;base64,${frame}`;
});

// screenstreamFrame.addEventListener("click", ({ offsetX, offsetY }) => {
//   const imageRect = screenstreamFrame.getBoundingClientRect();
//   const imageWidth = imageRect.width;
//   const imageHeight = imageRect.height;

//   ipcRenderer.send("remotecontrol-tap", {
//     xOffsetFactor: offsetX / imageWidth,
//     yOffsetFactor: offsetY / imageHeight,
//   });
// });
