ipcRenderer.on("authorise-screenstream", (_, deviceAddress) => {
  window.connectedDevices[deviceAddress].screenstreamAuthorised = true;
});

ipcRenderer.on("update-screenstream-frame", (_, deviceAddress, frame) => {
  if (!window.connectedDevices[deviceAddress].screenstreamInProgress) {
    const popOutToggleButton = document.createElement("button");
    popOutToggleButton.className = "screenstream-window-toggle-button";
    popOutToggleButton.textContent = "Display screen stream in new window";
    popOutToggleButton.onclick = () => {
      if (window.connectedDevices[deviceAddress].screenstreamPoppedOut) {
        ipcRenderer.send("screenstream-toggle-window", "sameWindow", deviceAddress);
        window.connectedDevices[deviceAddress].screenstreamPoppedOut = false;
        popOutToggleButton.textContent = "Display screen stream in new window";
      } else {
        ipcRenderer.send("screenstream-toggle-window", "newWindow", deviceAddress);
        window.connectedDevices[deviceAddress].screenstreamPoppedOut = true;
        popOutToggleButton.textContent = "Display screen stream in main window";
      }
    };

    document.querySelector(`#device-${window.connectedDevices[deviceAddress].token}`)
        .append(popOutToggleButton);
  }

  window.connectedDevices[deviceAddress].screenstreamInProgress = true;
  const screenstreamFrame = document
      .querySelector(`#device-${window.connectedDevices[deviceAddress].token} .screenstream-frame`);
  if (window.connectedDevices[deviceAddress].screenstreamAuthorised) {
    screenstreamFrame.src = `data:image/png;base64,${frame}`;
  }
});

ipcRenderer.on("screenstream-stop", (_, deviceAddress) => {
  window.connectedDevices[deviceAddress].screenstreamInProgress = false;
  window.connectedDevices[deviceAddress].screenstreamAuthorised = false;

  const deviceDiv = document
      .querySelector(`#device-${window.connectedDevices[deviceAddress].token}`);
  deviceDiv.querySelector(".screenstream-window-toggle-button").remove();
  // TODO: replace screen stream frame with message saying stream stopped
});
