// const screenstreamFrame = document.getElementById("screenstream-frame");

// update screenstream frame when ipcMain sends message
ipcRenderer.on("update-screenstream-frame",
    async (_, deviceAddress, deviceToken, frame) => {
      const screenstreamFrame = document
          .querySelector(`#device-${deviceToken} .screenstream-frame`);
      if (window.connectedDevices[deviceAddress].screenstreamAuthorised) {
        screenstreamFrame.src = `data:image/png;base64,${frame}`;
      }
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
