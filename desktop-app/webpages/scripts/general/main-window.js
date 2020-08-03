window.connectedDevices = {};

// receive connection info QR code
ipcRenderer.invoke("get-connection-info-qr-code").then((qrCode) => {
  console.log("Connection info QR code updated.");
  document.getElementById("connect-qr-code").src = qrCode;
});

const updateStatusPane = (deviceAddress) => {
  const device = window.connectedDevices[deviceAddress];

  document.querySelector("#device-status div:first-of-type")
      .textContent = deviceAddress;
  document.querySelector("#send-files span").textContent =
      `Send files to ${deviceAddress}`;

  if (device.fileTransferInProgress) {
    document.getElementById("no-file-transfer").classList.add("hidden");
    document.querySelectorAll("#no-file-transfer ~ :not(#files-transfer-files-list)")
        .forEach((elem) => {
          elem.classList.remove("hidden");
        });

    const { filename, totalFileSize, transferredSize, fileNumber } =
        device.fileTransferCurrentFile;

    document.getElementById("current-file").textContent =
        `Receiving file ${fileNumber} of ${device.fileTransferTotalFiles}`;

    const transferProgress = Math.round(transferredSize / totalFileSize * 100);
    document.getElementById("progress").textContent =
        `(${transferProgress}%) - ` +
        `${filesize(transferredSize)} / ${filesize(totalFileSize)}`;

    document.getElementById("file-transfer-progress-bar-filler").style.width =
        `${transferProgress}%`;

    document.getElementById("file-transfer-current-file-filename").textContent =
        filename;
  } else {
    document.getElementById("no-file-transfer").classList.remove("hidden");
    document.querySelectorAll("#no-file-transfer ~ :not(#files-transfer-files-list)")
        .forEach((elem) => {
          elem.classList.add("hidden");
        });
  }

  const filesListTable = document.getElementById("#file-transfer-files-list");
  filesListTable.querySelectorAll("tr:first-child ~ tr").forEach((tableRow) => {
    tableRow.remove();
  });
  for (const fileId in device.fileTransferFiles) {
    if (device.fileTransferFiles.hasOwnProperty(fileId)) {
      const { filename, transferType, totalFileSize, transferredSize } =
          device.fileTransferFiles[fileId];

      const fileInfoTr = document.createElement("tr");

      const fileNameTd = document.createElement("td");
      fileNameTd.textContent = filename;

      const totalFileSizeTd = document.createElement("td");
      totalFileSizeTd.textContent = filesize(totalFileSize);

      const transferStatusTd = document.createElement("td");
      const transferProgress = Math.round(transferredSize / totalFileSize *
          100);
      if (transferType === "send") {
        if (transferredSize === totalFileSize) {
          transferStatusTd.textContent = "Sent";
        } else {
          transferStatusTd.textContent = `Sending (${transferProgress}%)`;
        }
      } else if (transferType === "receive") {
        if (transferredSize === totalFileSize) {
          transferStatusTd.textContent = "Received";
        } else {
          transferStatusTd.textContent = `Receiving (${transferProgress}%)`;
        }
      }

      fileInfoTr.append(fileNameTd, totalFileSizeTd, transferStatusTd);
      filesListTable.append(fileInfoTr);
    }
  }
};

// update devices list
ipcRenderer.on("add-device", (_, deviceAddress, deviceToken) => {
  window.connectedDevices[deviceAddress] = {
    address: deviceAddress,
    token: deviceToken,
    screenstreamAuthorised: false,
    screenstreamInProgress: false,
    screenstreamPoppedOut: false,
    screenstreamControlsShown: true,
    fileTransferInProgress: false,
    currentFileTransferType: null, // "send" | "receive"
    fileTransferCurrentFile: null, // { filename: String, totalFileSize: Number, transferredSize: Number, fileNumber: Number }
    fileTransferTotalFiles: null, // Number

    // FIXME: BUT WHAT IF THERE ARE 2 FILES WITH SAME NAME?
    // set with window.connectedDevices[deviceAddress].fileTransferFiles[fileId] = { INFO }
    // fileId is a UUID assigned by main process when a file is transferred
    fileTransferFiles: {}, // { [fileId: String]: { filename: String, transferType: "send" | "receive", totalFileSize: Number, transferredSize: Number } }
  };

  const newDeviceDiv = document.createElement("div");
  newDeviceDiv.className = "connected-device";
  newDeviceDiv.id = `device-${deviceToken}`;
  newDeviceDiv.addEventListener("click", () => {
    document.querySelector(".device-selected").classList
        .remove("device-selected");
    newDeviceDiv.classList.add("device-selected");
    updateStatusPane(deviceAddress);
  });

  const deviceAddressDiv = document.createElement("div");
  deviceAddressDiv.className = "device-address";
  deviceAddressDiv.textContent = deviceAddress;

  const extraInfoDiv = document.createElement("div");
  extraInfoDiv.className = "extra-info";

  const screenSharingStatusSpan = document.createElement("span");
  screenSharingStatusSpan.className = "screen-sharing-status";

  const fileTransferInProgressSpan = document.createElement("span");
  fileTransferInProgressSpan.className = "file-transfer-in-progress";

  const fileTransferStatusSpan = document.createElement("span");
  fileTransferStatusSpan.className = "file-transfer-status";

  const currentFileSpan = document.createElement("span");
  currentFileSpan.className = "current-file";

  const progressSpan = document.createElement("span");
  progressSpan.className = "progress";

  fileTransferStatusSpan.append(currentFileSpan, progressSpan);
  extraInfoDiv.append(screenSharingStatusSpan, fileTransferInProgressSpan,
      fileTransferStatusSpan);
  newDeviceDiv.append(deviceAddressDiv, extraInfoDiv);
  document.getElementById("connected-devices").append(newDeviceDiv);

  // const deviceInfoDiv = document.createElement("div");
  // deviceInfoDiv.className = "device-info";
  // deviceInfoDiv.textContent = `Address: ${deviceAddress}\nToken: ${deviceToken}`;

  // const deviceScreenstreamFrame = document.createElement("img");
  // deviceScreenstreamFrame.className = "screenstream-frame";
  // deviceScreenstreamFrame.onclick = (event) => {
  //   const position = getRemoteControlTapPosition(event, deviceScreenstreamFrame);
  //   ipcRenderer.send("remotecontrol-tap", position, deviceAddress);
  // };

  // // navigation buttons for device
  // const backButton = document.createElement("button");
  // backButton.textContent = "Back";
  // backButton.onclick = () => {
  //   ipcRenderer.send("remotecontrol-back", deviceAddress);
  // };

  // const homeButton = document.createElement("button");
  // homeButton.textContent = "Home";
  // homeButton.onclick = () => {
  //   ipcRenderer.send("remotecontrol-home", deviceAddress);
  // };

  // const recentsButton = document.createElement("button");
  // recentsButton.textContent = "Recents";
  // recentsButton.onclick = () => {
  //   ipcRenderer.send("remotecontrol-recents", deviceAddress);
  // };

  // const sendFilesButton = document.createElement("button");
  // sendFilesButton.textContent = "Send Files to Device";
  // sendFilesButton.onclick = async () => {
  //   // get filePaths for later use
  //   ipcRenderer.invoke("filetransfer-choose-files", deviceAddress)
  //       .then((filePaths) => {

  //       });
  // };

  // newDeviceDiv.append(deviceInfoDiv, deviceScreenstreamFrame,
  //     backButton, homeButton, recentsButton, sendFilesButton);
  // document.getElementById("devices-list").append(newDeviceDiv);
});

ipcRenderer.on("remove-device", (_, deviceAddress, deviceToken) => {
  document.querySelector(`#device-${deviceToken}`).remove();
  delete window.connectedDevices[deviceAddress];
});

ipcRenderer.on("screenstream-new-window-closed", (_, deviceAddress) => {
  window.connectedDevices[deviceAddress].screenstreamPoppedOut = false;
  document.querySelector(`#device-${window.connectedDevices[deviceAddress].token}
      .screenstream-window-toggle-button`)
      .textContent = "Display screen stream in new window";
});
