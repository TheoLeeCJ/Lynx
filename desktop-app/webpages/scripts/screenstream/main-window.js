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
    // screenstreamAuthorised: false,
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

ipcRenderer.on("remove-device", (_, deviceAddress, deviceToken) => {
  delete window.connectedDevices[deviceAddress];
  document.querySelector(`#device-${deviceToken}`).remove();
});

// TODO: 1 pop-out window per device
// toggle between displaying stream in current or new window
let streamInCurrentWindow = true;

document.getElementById("screenstream-window-toggle-button")
    .addEventListener("click", (event) => {
      if (streamInCurrentWindow) {
        // transfer stream from current window to new window
        screenstreamFrame.src = "";
        streamInCurrentWindow = false;
        ipcRenderer.send("toggle-phone-screen-window", "newWindow");
        event.target.textContent = "Display phone screen in this window";
      } else {
        // transfer stream from new window to current window
        streamInCurrentWindow = true;
        ipcRenderer.send("toggle-phone-screen-window", "sameWindow");
        event.target.textContent = "Display phone screen in new window";
      }
    });
