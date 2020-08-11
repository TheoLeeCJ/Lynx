// TODO: verify screenstreamInProgress and screenstreamAuthorised
const deviceScreenstreamFrame = document.getElementById("screenstream-frame");

ipcRenderer.on("update-screenstream-frame", (_, deviceAddress, frame) => {
  deviceScreenstreamFrame.src = `data:image/png;base64,${frame}`;
});

ipcRenderer.on("screenstream-stop", (_, deviceAddress) => {
  // TODO: display alert in window screen stream frame region
  // telling user that screen stream was terminated
  // and DON'T automatically close window (delete next line)
  window.close();
});

// ipcRenderer.on("set-stream-img-size", (_, streamImgSize) => {
//   deviceScreenstreamFrame.width = streamImgSize.width;
//   deviceScreenstreamFrame.height = streamImgSize.height;
// });

ipcRenderer.on("resize-stream", (_, orientation, { width, height }) => {
  // if (orientation === "portrait") {
  //   if (width < height) {
  //     deviceScreenstreamFrame.style.height = "100%";
  //   } else {
  //     deviceScreenstreamFrame.style.width = "100%";
  //   }
  // } else {
  //   if (width < height) {
  //     deviceScreenstreamFrame.style.width = "100%";
  //   } else {
  //     deviceScreenstreamFrame.style.height = "100%";
  //   }
  // }
});

deviceScreenstreamFrame.onclick = (event) => {
  const position = getRemoteControlTapPosition(event, deviceScreenstreamFrame);
  ipcRenderer.send("remotecontrol-tap", position, window.deviceAddress);
};

deviceScreenstreamFrame.oncontextmenu = (event) => {
  ipcRenderer.send("screenstream-fullscreen", window.deviceAddress);
};