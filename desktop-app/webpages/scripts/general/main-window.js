fileSizeToString = filesize.partial({ spacer: "" });

window.connectedDevices = {
  "test-device": {
    address: "test-address",
    token: "aaaaaaaaaaaa",

    screenstreamPoppedOut: false,
    screenstreamControlsShown: true,
    sendingFiles: false,
    receivingFiles: true,
    sentFiles: [
      {
        filename: "a.txt",
        filePath: "C:\\Users\\yip\\Documents\\Lynx\\a.txt",
        fileSize: 11000,
        transferredSize: 11000,
      },
      {
        filename: "longAssFilenameThatIsSuperFreakingLong.png",
        filePath: "C:\\Users\\yip\\Documents\\Lynx\\longAssFilenameThatIsSuperFreakingLong.png",
        fileSize: 2700000000,
        transferredSize: 2700000000,
      },
    ],
    receivedFiles: [
      {
        filename: "a.txt",
        filePath: "C:\\Users\\yip\\Documents\\Lynx\\a.txt",
        fileSize: 11000,
        transferredSize: 11000,
      },
      {
        filename: "longAssFilenameThatIsSuperFreakingLong.png",
        filePath: "C:\\Users\\yip\\Documents\\Lynx\\longAssFilenameThatIsSuperFreakingLong.png",
        fileSize: 2700000000,
        transferredSize: 2700000000,
      },
    ],
    outgoingFiles: [],
    incomingFiles: [
      {
        filename: "a.txt",
        filePath: "C:\\Users\\yip\\Documents\\Lynx\\a.txt",
        fileSize: 12000,
        transferredSize: 24000,
      },
      {
        filename: "longAssFilenameThatIsSuperFreakingLong.png",
        filePath: "C:\\Users\\yip\\Documents\\Lynx\\longAssFilenameThatIsSuperFreakingLong.png",
        fileSize: 2800000000,
        transferredSize: 3800000000,
      },
    ],
  },
};

// const escapeForCssSelector = (str) => str
//     .replace(/[\~\!\@\$\%\^\&\*\(\)\+\=\,\.\/\'\;\:\"\?\>\<\[\]\\\{\}\|\`\#]/g,
//         "\\$&")

// receive connection info QR code
// ipcRenderer.invoke("get-connection-info-qr-code").then((qrCode) => {
//   console.log("Connection info QR code updated.");
//   document.getElementById("connect-qr-code").src = qrCode;
// });

// tell main process that renderer process is ready for messages
ipcRenderer.send("ready");

ipcRenderer.on("update-connection-info-qr-code", (_, qrCode) => {
  console.log("Connection info QR code updated.");
  document.getElementById("connect-qr-code").src = qrCode;
});

let prevSendFilesClickListener;

const updateUi = (deviceAddress) => {
  const device = window.connectedDevices[deviceAddress];
  const deviceIsSelected = document.querySelector(`#device-${device.token}`)
      .classList.contains("device-selected");

  if (deviceIsSelected) {
    document.querySelector("#device-status div:first-of-type")
        .textContent = `Address: ${deviceAddress}`;
  }

  const sidebarDevice = document.getElementById(`device-${device.token}`);

  const sidebarScreenSharingStatus = sidebarDevice
      .getElementsByClassName("screen-sharing-status")[0];
  const statusPaneScreenSharingStatus = document
      .getElementById("screen-sharing-status");
  const statusPaneRemoteControlStatus = document
      .getElementById("remote-control-status");
  if (device.screenstreamInProgress) {
    if (deviceIsSelected) {
      statusPaneScreenSharingStatus.textContent = "Screen sharing in progress";
    }

    if (device.remoteControlEnabled) {
      sidebarScreenSharingStatus.textContent =
          "Screen sharing in progress (remote control enabled)";
      if (deviceIsSelected) {
        statusPaneRemoteControlStatus.style.color = "#000";
        statusPaneRemoteControlStatus.textContent =
            "Remote control enabled";
      }
    } else {
      sidebarScreenSharingStatus.textContent =
          "Screen sharing in progress (remote control disabled)";
      if (deviceIsSelected) {
        statusPaneRemoteControlStatus.style.color = "#f00";
        statusPaneRemoteControlStatus.textContent =
            "Remote control disabled";
      }
    }
  } else {
    sidebarScreenSharingStatus.textContent = "";
    if (deviceIsSelected) {
      statusPaneScreenSharingStatus.textContent = "Screen sharing not started";
      document.querySelectorAll("#screen-sharing-status ~ *").forEach((elem) => {
        elem.classList.add("hidden");
      });
    }
  }

  const sidebarFileTransferInProgress = sidebarDevice
      .getElementsByClassName("file-transfer-in-progress")[0];
  if (device.sendingFiles && device.receivingFiles) {
    sidebarFileTransferInProgress.textContent =
          "File transfer in progress (inbound, outbound)";
  } else if (device.sendingFiles) {
    sidebarFileTransferInProgress.textContent =
          "File transfer in progress (outbound)";
  } else if (device.receivingFiles) {
    sidebarFileTransferInProgress.textContent =
          "File transfer in progress (inbound)";
  } else {
    sidebarFileTransferInProgress.textContent = "";
  }

  const sidebarFileTransferSendStatus = sidebarDevice
      .getElementsByClassName("file-transfer-send-status")[0];
  const statusPaneSendFilesButton = document.getElementById("send-files");
  const statusPaneOutgoingFiles = document.getElementById("outgoing-files");
  const statusPaneFileTransferSendStatus = statusPaneOutgoingFiles
      .getElementsByClassName("file-transfer-status")[0];
  const outgoingAndSentFilesTable = statusPaneOutgoingFiles
      .querySelector(".file-transfer-files-list tbody");

  // edit textContent of span within button, not that of the button itself
  statusPaneSendFilesButton.firstChild.textContent =
      `Send files to ${deviceAddress}`;
  // set new click event listener
  const newSendFilesClickListener = async () => {
    const chosenFiles = await ipcRenderer.invoke("filetransfer-choose-files",
        deviceAddress);
  };
  statusPaneSendFilesButton.removeEventListener("click", prevSendFilesClickListener);
  statusPaneSendFilesButton.addEventListener("click", newSendFilesClickListener);
  prevSendFilesClickListener = newSendFilesClickListener;

  if (deviceIsSelected) {
    outgoingAndSentFilesTable.querySelectorAll("tr:not(:first-child)")
        .forEach((row) => {
          row.remove();
        });
    for (let i = device.outgoingFiles.length - 1; i >= 0; i--) {
      const { filename, filePath, fileSize, transferredSize } = device
          .outgoingFiles[i];

      const outgoingFileRow = document.createElement("tr");

      const filenameCell = document.createElement("td");
      filenameCell.textContent = filename;

      const fileSizeCell = document.createElement("td");
      fileSizeCell.textContent = fileSizeToString(fileSize);

      const fileStatusCell = document.createElement("td");
      if (transferredSize === fileSize) {
        fileStatusCell.textContent = "Sent";
      } else if (transferredSize === 0) {
        fileStatusCell.textContent = "Waiting to send";
      } else {
        fileStatusCell.textContent =
            `Sending (${transferredSize / fileSize * 100}%)`;
      }

      outgoingFileRow.append(filenameCell, fileSizeCell, fileStatusCell);
      // TODO: click & dblclick events
      outgoingFileRow.addEventListener("click", () => {
        // de-select other rows, select this one
      });
      outgoingFileRow.addEventListener("dblclick", () => {
        // send message to main process to open this file (use filePath)
      });
      outgoingAndSentFilesTable.append(outgoingFileRow);
    }
    for (let i = device.sentFiles.length - 1; i >= 0; i--) {
      const { filename, filePath, fileSize } = device.sentFiles[i];

      const sentFileRow = document.createElement("tr");

      const filenameCell = document.createElement("td");
      filenameCell.textContent = filename;

      const fileSizeCell = document.createElement("td");
      fileSizeCell.textContent = fileSizeToString(fileSize);

      const fileStatusCell = document.createElement("td");
      fileStatusCell.textContent = "Sent";

      sentFileRow.append(filenameCell, fileSizeCell, fileStatusCell);
      // TODO: click & dblclick events
      sentFileRow.addEventListener("click", () => {
        // de-select other rows, select this one
      });
      sentFileRow.addEventListener("dblclick", () => {
        // send message to main process to open this file (use filePath)
      });
      outgoingAndSentFilesTable.append(sentFileRow);
    }
  }

  if (device.sendingFiles) {
    const outgoingFileProgressBarFiller = statusPaneOutgoingFiles
        .getElementsByClassName("file-transfer-progress-bar-filler")[0];
    const outgoingFileFilename = statusPaneOutgoingFiles
        .getElementsByClassName("file-transfer-current-file-filename")[0];

    const outgoingFileSentPercentage =
        (device.outgoingFiles[0].transferredSize /
        device.outgoingFiles[0].fileSize * 100).toFixed(1);
    const fileTransferSendStatusString = `Sending file ${device.outgoingFileNumber} of ${device.outgoingFilesBatchSize} ` +
        `(${outgoingFileSentPercentage}%) - ` +
        `${fileSizeToString(device.outgoingFiles[0].transferredSize)} / ${fileSizeToString(device.outgoingFiles[0].fileSize)}`;

    sidebarFileTransferSendStatus.textContent = fileTransferSendStatusString;
    if (deviceIsSelected) {
      statusPaneOutgoingFiles
          .querySelectorAll(".file-transfer-status ~ :not(.file-transfer-files-list)")
          .forEach((elem) => {
            elem.classList.remove("hidden");
          });
      statusPaneFileTransferSendStatus.textContent = fileTransferSendStatusString;
      outgoingFileProgressBarFiller.style.width =
          `calc((100% + 2px) * ${outgoingFileSentPercentage / 100})`;
      outgoingFileFilename.textContent = device.outgoingFiles[0].filename;
    }
  } else {
    sidebarFileTransferSendStatus.textContent = "";
    if (deviceIsSelected) {
      statusPaneOutgoingFiles
          .querySelectorAll(".file-transfer-status ~ :not(.file-transfer-files-list)")
          .forEach((elem) => {
            elem.classList.add("hidden");
          });
      statusPaneFileTransferSendStatus.textContent = "No outgoing files";
      if (device.outgoingFiles.length === 0 && device.sentFiles.length === 0) {
        const noOutgoingOrSentFilesTr = document.createElement("tr");
        noOutgoingOrSentFilesTr.dataset.noOutgoingOrSentFiles = "1";
        const noOutgoingOrSentFilesTd = document.createElement("td");
        noOutgoingOrSentFilesTd.textContent = "No outgoing or sent files";
        noOutgoingOrSentFilesTr.append(noOutgoingOrSentFilesTd);
        outgoingAndSentFilesTable.append(noOutgoingOrSentFilesTr);
      }
    }
  }

  const sidebarFileTransferReceiveStatus = sidebarDevice
      .getElementsByClassName("file-transfer-receive-status")[0];
  const statusPaneIncomingFiles = document.getElementById("incoming-files");
  const statusPaneFileTransferReceiveStatus = statusPaneIncomingFiles
      .getElementsByClassName("file-transfer-status")[0];
  const incomingAndReceivedFilesTable = statusPaneIncomingFiles
      .querySelector(".file-transfer-files-list tbody");

  if (deviceIsSelected) {
    incomingAndReceivedFilesTable.querySelectorAll("tr:not(:first-child)")
        .forEach((row) => {
          row.remove();
        });
    for (let i = device.incomingFiles.length - 1; i >= 0; i--) {
      const { filename, filePath, fileSize, transferredSize } = device
          .incomingFiles[i];

      const incomingFileRow = document.createElement("tr");

      const filenameCell = document.createElement("td");
      filenameCell.textContent = filename;

      const fileSizeCell = document.createElement("td");
      fileSizeCell.textContent = fileSizeToString(fileSize);

      const fileStatusCell = document.createElement("td");
      if (transferredSize === fileSize) {
        fileStatusCell.textContent = "Received";
      } else if (transferredSize === 0) {
        fileStatusCell.textContent = "Waiting to receive";
      } else {
        fileStatusCell.textContent =
            `Receiving (${transferredSize / fileSize * 100}%)`;
      }

      incomingFileRow.append(filenameCell, fileSizeCell, fileStatusCell);
      // TODO: click & dblclick events
      incomingFileRow.addEventListener("click", () => {
        // de-select other rows, select this one
      });
      // note: no open on dblclick for incoming files
      // because they haven't been written to disk yet
      incomingAndReceivedFilesTable.append(incomingFileRow);
    }
    for (let i = device.receivedFiles.length - 1; i >= 0; i--) {
      const { filename, filePath, fileSize } = device.receivedFiles[i];

      const receivedFileRow = document.createElement("tr");

      const filenameCell = document.createElement("td");
      filenameCell.textContent = filename;

      const fileSizeCell = document.createElement("td");
      fileSizeCell.textContent = fileSizeToString(fileSize);

      const fileStatusCell = document.createElement("td");
      fileStatusCell.textContent = "Received";

      receivedFileRow.append(filenameCell, fileSizeCell, fileStatusCell);
      // TODO: click & dblclick events
      receivedFileRow.addEventListener("click", () => {
        // de-select other rows, select this one
      });
      receivedFileRow.addEventListener("dblclick", () => {
        // send message to main process to open this file (use filePath)
      });
      incomingAndReceivedFilesTable.append(receivedFileRow);
    }
  }

  if (device.receivingFiles) {
    const incomingFileProgressBarFiller = statusPaneIncomingFiles
        .getElementsByClassName("file-transfer-progress-bar-filler")[0];
    const incomingFileFilename = statusPaneIncomingFiles
        .getElementsByClassName("file-transfer-current-file-filename")[0];

    const incomingFileReceivedPercentage =
        (device.incomingFiles[0].transferredSize /
        device.incomingFiles[0].fileSize * 100).toFixed(1);
    const fileTransferReceiveStatusString = `Receiving file ${device.incomingFileNumber} of ${device.incomingFilesBatchSize} ` +
        `(${incomingFileReceivedPercentage}%) - ` +
        `${fileSizeToString(device.incomingFiles[0].transferredSize)} / ${fileSizeToString(device.incomingFiles[0].fileSize)}`;

    sidebarFileTransferReceiveStatus.textContent = fileTransferReceiveStatusString;
    if (deviceIsSelected) {
      statusPaneIncomingFiles
          .querySelectorAll(".file-transfer-status ~ :not(.file-transfer-files-list)")
          .forEach((elem) => {
            elem.classList.remove("hidden");
          });
      statusPaneFileTransferReceiveStatus.textContent = fileTransferReceiveStatusString;
      incomingFileProgressBarFiller.style.width =
          `calc((100% + 2px) * ${incomingFileReceivedPercentage / 100})`;
      incomingFileFilename.textContent = device.incomingFiles[0].filename;
    }
  } else {
    sidebarFileTransferReceiveStatus.textContent = "";
    if (deviceIsSelected) {
      statusPaneIncomingFiles
          .querySelectorAll(".file-transfer-status ~ :not(.file-transfer-files-list)")
          .forEach((elem) => {
            elem.classList.add("hidden");
          });
      statusPaneFileTransferReceiveStatus.textContent = "No incoming files";
      if (device.incomingFiles.length === 0 && device.receivedFiles.length === 0) {
        const noIncomingOrReceivedFilesTr = document.createElement("tr");
        noIncomingOrReceivedFilesTr.dataset.noIncomingOrReceivedFiles = "1";
        const noIncomingOrReceivedFilesTd = document.createElement("td");
        noIncomingOrReceivedFilesTd.textContent = "No incoming or received files";
        noIncomingOrReceivedFilesTr.append(noIncomingOrReceivedFilesTd);
        incomingAndReceivedFilesTable.append(noIncomingOrReceivedFilesTr);
      }
    }
  }
};

// update devices list
ipcRenderer.on("add-device", (_, deviceAddress, deviceToken) => {
  window.connectedDevices[deviceAddress] = new Device({
    address: deviceAddress,
    token: deviceToken,
  });

  const newDeviceDiv = document.createElement("div");
  newDeviceDiv.className = "connected-device";
  newDeviceDiv.id = `device-${deviceToken}`;
  newDeviceDiv.addEventListener("click", () => {
    const prevSelectedDevice = document.querySelector(".device-selected");
    if (prevSelectedDevice !== null) {
      prevSelectedDevice.classList.remove("device-selected");
    }
    newDeviceDiv.classList.add("device-selected");
    updateUi(deviceAddress);
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

  const fileTransferSendStatusSpan = document.createElement("span");
  fileTransferSendStatusSpan.className = "file-transfer-send-status";

  const fileTransferReceiveStatusSpan = document.createElement("span");
  fileTransferReceiveStatusSpan.className = "file-transfer-receive-status";

  extraInfoDiv.append(screenSharingStatusSpan, fileTransferInProgressSpan,
      fileTransferSendStatusSpan, fileTransferReceiveStatusSpan);
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

ipcRenderer.on("remotecontrol-setting-changed",
    (_, deviceAddress, newRemoteControlSetting) => {
      const device = global.connectedDevices[deviceAddress];
      device.remoteControlEnabled = newRemoteControlSetting;
      updateUi(deviceAddress);
    });

ipcRenderer.on("filetransfer-new-outgoing-files",
    (_, deviceAddress, newOutgoingFiles) => {
      const device = window.connectedDevices[deviceAddress];
      device.outgoingFiles = device.outgoingFiles.concat(newOutgoingFiles);
      device.outgoingFilesBatchSize += newOutgoingFiles.length;
      device.sendingFiles = true;

      updateUi(deviceAddress);
      console.log(`New outgoing files to ${deviceAddress}`);
    });

ipcRenderer.on("filetransfer-outgoing-file-start",
    (_, deviceAddress, outgoingFileSize) => {
      const device = window.connectedDevices[deviceAddress];
      device.outgoingFiles[0].fileSize = outgoingFileSize;
      device.outgoingFileNumber++;

      updateUi(deviceAddress);
      console.log(`Started transferring ${device.outgoingFiles[0].filename} to ${deviceAddress}`);
    });

ipcRenderer.on("filetransfer-outgoing-file-progress",
    (_, deviceAddress, bytesSent) => {
      const device = window.connectedDevices[deviceAddress];
      device.outgoingFiles[0].transferredSize += bytesSent;

      updateUi(deviceAddress);
      console.log(`Made progress of ${bytesSent} on sending file to ${deviceAddress}`);
    });

ipcRenderer.on("filetransfer-outgoing-file-end", (_, deviceAddress) => {
  const device = window.connectedDevices[deviceAddress];
  device.sentFiles.push(device.outgoingFiles.shift());
  if (device.outgoingFiles.length === 0) {
    device.outgoingFilesBatchSize = 0;
    device.outgoingFileNumber = 0;
    device.sendingFiles = false;
  }

  updateUi(deviceAddress);
  console.log(`Finished transferring ${device.sentFiles[device.sentFiles.length - 1].filename} to ${deviceAddress}`);
});

ipcRenderer.on("filetransfer-new-incoming-files",
    (_, deviceAddress, newIncomingFiles) => {
      const device = window.connectedDevices[deviceAddress];
      device.incomingFiles = device.incomingFiles.concat(newIncomingFiles);
      device.incomingFilesBatchSize += newIncomingFiles.length;
      device.receivingFiles = true;

      updateUi(deviceAddress);
      console.log(`New incoming files from ${deviceAddress}:`, newIncomingFiles);
    });

ipcRenderer.on("filetransfer-incoming-file-start",
    (_, deviceAddress, incomingFileSize) => {
      const device = window.connectedDevices[deviceAddress];
      device.incomingFiles[0].fileSize = incomingFileSize;
      device.incomingFileNumber++;

      updateUi(deviceAddress);
      console.log(`Device at ${deviceAddress} started transferring ${device.incomingFiles[0].filename}`);
    });

ipcRenderer.on("filetransfer-incoming-file-progress",
    (_, deviceAddress, bytesReceived) => {
      const device = window.connectedDevices[deviceAddress];
      device.incomingFiles[0].transferredSize += bytesReceived;

      updateUi(deviceAddress);
      console.log(`Device at ${deviceAddress} made progress of ${bytesReceived} on ${device.incomingFiles[0].filename}`);
    });

ipcRenderer.on("filetransfer-incoming-file-end", (_, deviceAddress) => {
  const device = window.connectedDevices[deviceAddress];
  device.receivedFiles.push(device.incomingFiles.shift());
  if (device.incomingFiles.length === 0) {
    device.incomingFilesBatchSize = 0;
    device.incomingFileNumber = 0;
    device.receivingFiles = false;
  }

  updateUi(deviceAddress);
  console.log(`Device at ${deviceAddress} finished transferring ${device.receivedFiles[device.receivedFiles.length - 1].filename}`);
});
