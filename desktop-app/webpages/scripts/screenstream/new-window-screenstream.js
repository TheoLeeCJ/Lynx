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

deviceScreenstreamFrame.onclick = (event) => {
  const position = getRemoteControlTapPosition(event, deviceScreenstreamFrame);
  ipcRenderer.send("remotecontrol-tap", position, window.deviceAddress);
};
