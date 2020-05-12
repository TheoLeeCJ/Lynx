// const screenstreamFrame = document.getElementById("screenstream-frame");

// update screenstream frame when ipcMain sends message
ipcRenderer.on("update-screenstream-frame", (_, deviceAddress, deviceToken, frame) => {
  document.querySelector(`#device-${deviceToken} .screenstream-frame`)
      .src = `data:image/png;base64,${frame}`;
  // if (window.connectedDevices[deviceAddress].screenstreamAuthorised) {
  //   document.querySelector(`#device-${deviceToken} .screenstream-frame`)
  //       .src = `data:image/png;base64,${frame}`;
  // } else {
  //   // TODO: alert user that "A device with IP address [IP] is trying to screen share. Allow?"
  //   // document.querySelector(`#device-${deviceToken} .screenstream-alert`)
  // }
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
