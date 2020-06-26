window.connectedDevices = {};

// tell main process that renderer process is ready for messages
ipcRenderer.send("ready");

// receive connection info QR code
ipcRenderer.on("update-connection-info-qr-code", (_, connectionInfoQrCode) => {
  console.log("Connection info QR code updated.");
  document.getElementById("connection-info-qr-code").src = connectionInfoQrCode;
});

// update devices list
ipcRenderer.on("add-device", (_, deviceAddress, deviceToken) => {
  window.connectedDevices[deviceAddress] = {
    address: deviceAddress,
    token: deviceToken,
    screenstreamAuthorised: false,
    screenstreamInProgress: false,
    screenstreamPoppedOut: false,
  };

  // show new device in window
  const newDeviceDiv = document.createElement("div");
  newDeviceDiv.className = "device";
  newDeviceDiv.id = `device-${deviceToken}`;

  const deviceInfoDiv = document.createElement("div");
  deviceInfoDiv.className = "device-info";
  deviceInfoDiv.textContent = `Address: ${deviceAddress}\nToken: ${deviceToken}`;

  const deviceScreenstreamFrame = document.createElement("img");
  deviceScreenstreamFrame.className = "screenstream-frame";
  deviceScreenstreamFrame.onclick = (event) => {
    const position = getRemoteControlTapPosition(event, deviceScreenstreamFrame);
    ipcRenderer.send("remotecontrol-tap", position, deviceAddress);
  };

  // navigation buttons for device
  const backButton = document.createElement("button");
  backButton.textContent = "Back";
  backButton.onclick = () => {
    ipcRenderer.send("remotecontrol-back", deviceAddress);
  };

  const homeButton = document.createElement("button");
  homeButton.textContent = "Home";
  homeButton.onclick = () => {
    ipcRenderer.send("remotecontrol-home", deviceAddress);
  };

  const recentsButton = document.createElement("button");
  recentsButton.textContent = "Recents";
  recentsButton.onclick = () => {
    ipcRenderer.send("remotecontrol-recents", deviceAddress);
  };

  newDeviceDiv.append(deviceInfoDiv, deviceScreenstreamFrame,
      backButton, homeButton, recentsButton);
  document.getElementById("devices-list").append(newDeviceDiv);
});

ipcRenderer.on("remove-device", (_, deviceAddress) => {
  document.querySelector(`#device-${window.connectedDevices[deviceAddress].token}`)
      .remove();
  delete window.connectedDevices[deviceAddress];
});

ipcRenderer.on("screenstream-new-window-closed", (_, deviceAddress) => {
  window.connectedDevices[deviceAddress].screenstreamPoppedOut = false;
  document.querySelector(`#device-${window.connectedDevices[deviceAddress].token}
      .screenstream-window-toggle-button`)
      .textContent = "Display screen stream in new window";
});
