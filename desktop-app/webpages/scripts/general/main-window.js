fileSizeToString = filesize.partial({ spacer: "" });

window.connectedDevices = {};

Object.defineProperty(window, "numberOfConnectedDevices", {
  get() {
    return Object.keys(window.connectedDevices).length;
  },
});

// tell main process that renderer process is ready for messages
ipcRenderer.send("ready");

ipcRenderer.on("update-connection-info-qr-code", (_, qrCode) => {
  console.log("Connection info QR code updated.");
  document.getElementById("connect-qr-code").src = qrCode;
});

const prevEventListeners = {
  fileTransfer: {
    sendFilesButton: null,
  },
  screenSharing: {
    toggleControls: null,
    popStreamOut: null,
    displayStreamInMainWindow: null,
  },
  remoteControl: {
    phoneScreen: null,
    back: null,
    home: null,
    recents: null,
  },
};

const updateUi = (deviceAddress) => {
  const device = window.connectedDevices[deviceAddress];
  const deviceDiv = document.getElementById(`device-${device.token}`);
  const deviceIsSelected = deviceDiv.classList.contains("device-selected");

  if (deviceIsSelected) {
    document.querySelector("#device-status div:first-of-type").textContent =
        `Name: ${device.deviceMetadata.deviceName}\nAddress: ${deviceAddress}`;
  }

  /* ------------------ SCREEN SHARING ------------------ */

  const sidebarScreenSharingStatus = deviceDiv
      .getElementsByClassName("screen-sharing-status")[0];
  const statusPaneScreenSharingStatus = document
      .getElementById("screen-sharing-status");
  const statusPaneRemoteControlStatus = document
      .getElementById("remote-control-status");
  const screenSharingPane = document.getElementById("screen-sharing");
  const phoneScreen = document.getElementById("phone-screen");

  if (device.screenstreamAuthorised && !device.screenstreamInProgress) {
    sidebarScreenSharingStatus.textContent = "Screen sharing authorised, awaiting stream start";

    if (deviceIsSelected) {
      statusPaneScreenSharingStatus.textContent =
          "Screen sharing authorised, awaiting stream start";
    }
  }

  if (device.screenstreamInProgress) {
    if (deviceIsSelected) {
      statusPaneScreenSharingStatus.textContent = "Screen sharing in progress";
      document.querySelectorAll("#screen-sharing-status ~ *").forEach((elem) => {
        elem.classList.remove("hidden");
      });

      if (device.screenstreamPoppedOut) {
        screenSharingPane.classList.add("stream-popped-out");

        const displayStreamInMainWindowButton = document
            .getElementById("display-stream-in-main-window");
        displayStreamInMainWindowButton.removeEventListener("click",
            prevEventListeners.screenSharing.displayStreamInMainWindow);
        const newDisplayStreamInMainWindowEventListener = () => {
          device.screenstreamPoppedOut = false;
          ipcRenderer.send("screenstream-toggle-window", deviceAddress,
              "sameWindow");
          updateUi(deviceAddress);
        };
        displayStreamInMainWindowButton.addEventListener("click",
            newDisplayStreamInMainWindowEventListener);
        prevEventListeners.screenSharing.displayStreamInMainWindow =
            newDisplayStreamInMainWindowEventListener;
      } else {
        screenSharingPane.classList.remove("stream-popped-out");

        const toggleControlsButton = document
            .getElementById("hide-screen-sharing-controls");
        if (device.screenstreamControlsShown) {
          toggleControlsButton.textContent = "Hide controls";
        } else {
          toggleControlsButton.textContent = "Show controls";
        }
        toggleControlsButton.removeEventListener("click", prevEventListeners
            .screenSharing.toggleControls);
        const newToggleControlsEventListener = () => {
          device.screenstreamControlsShown = !device.screenstreamControlsShown;
          updateUi(deviceAddress);
        };
        toggleControlsButton.addEventListener("click",
            newToggleControlsEventListener);
        prevEventListeners.screenSharing.toggleControls =
            newToggleControlsEventListener;

        const popStreamOutButton = document.getElementById("pop-stream-out");
        popStreamOutButton.removeEventListener("click", prevEventListeners
            .screenSharing.popStreamOut);
        const newPopStreamOutEventListener = () => {
          device.screenstreamPoppedOut = true;
          ipcRenderer.send("screenstream-toggle-window", deviceAddress,
              "newWindow");
          updateUi(deviceAddress);
        };
        popStreamOutButton.addEventListener("click", newPopStreamOutEventListener);
        prevEventListeners.screenSharing.popStreamOut =
            newPopStreamOutEventListener;

        const phoneControls = document.getElementById("phone-controls");
        if (device.screenstreamControlsShown) {
          phoneControls.classList.remove("hidden");
          phoneScreen.style.maxHeight = "calc(100% - 42px)";
        } else {
          phoneControls.classList.add("hidden");
          phoneScreen.style.maxHeight = "100%";
        }
      }
    }

    if (device.remoteControlEnabled) {
      sidebarScreenSharingStatus.textContent =
          "Screen sharing in progress (remote control enabled)";
      if (deviceIsSelected) {
        statusPaneRemoteControlStatus.style.color = "#000";
        statusPaneRemoteControlStatus.textContent =
            "Remote control enabled";

        // remove previous event listeners, add current ones for this device
        const remoteControlButtons = {
          back: document.getElementById("back-button"),
          home: document.getElementById("home-button"),
          recents: document.getElementById("recents-button"),
        };
        for (const buttonName in remoteControlButtons) {
          if (Object.prototype.hasOwnProperty.call(remoteControlButtons,
              buttonName)) {
            remoteControlButtons[buttonName].removeEventListener("click",
                prevEventListeners.remoteControl[buttonName]);
            const newButtonEventListener = () => {
              console.log(`${buttonName} button clicked`);
              ipcRenderer.send(`remotecontrol-${buttonName}`, deviceAddress);
            };
            remoteControlButtons[buttonName].addEventListener("click",
                newButtonEventListener);
            prevEventListeners.remoteControl[buttonName] = newButtonEventListener;
          }
        }
        phoneScreen.removeEventListener("click", prevEventListeners.remoteControl
            .phoneScreen);
        const newPhoneScreenEventListener = (event) => {
          const position = getRemoteControlTapPosition(event, phoneScreen);
          ipcRenderer.send("remotecontrol-tap", position, deviceAddress);
        };
        phoneScreen.addEventListener("click", newPhoneScreenEventListener);
        prevEventListeners.remoteControl.phoneScreen = newPhoneScreenEventListener;
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

  const sidebarFileTransferInProgress = deviceDiv
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

  /* ------------------ FILE TRANSFER ------------------ */

  const sidebarFileTransferSendStatus = deviceDiv
      .getElementsByClassName("file-transfer-send-status")[0];
  const statusPaneSendFilesButton = document.getElementById("send-files");
  const statusPaneOutgoingFiles = document.getElementById("outgoing-files");
  const statusPaneFileTransferSendStatus = statusPaneOutgoingFiles
      .getElementsByClassName("file-transfer-status")[0];
  const outgoingAndSentFilesTable = statusPaneOutgoingFiles
      .querySelector(".file-transfer-files-list tbody");

  if (deviceIsSelected) {
    // edit textContent of span within button, not that of the button itself
    statusPaneSendFilesButton.firstChild.textContent =
        `Send files to ${device.deviceMetadata.deviceName}`;
    // set new click event listener
    const newSendFilesClickListener = async () => {
      const chosenFiles = await ipcRenderer.invoke("filetransfer-choose-files",
          deviceAddress);
    };
    statusPaneSendFilesButton.removeEventListener("click",
        prevEventListeners.fileTransfer.sendFilesButton);
    statusPaneSendFilesButton.addEventListener("click", newSendFilesClickListener);
    prevEventListeners.fileTransfer.sendFilesButton = newSendFilesClickListener;

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
            `Sending (${(transferredSize / fileSize * 100).toFixed(1)}%)`;
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

  const sidebarFileTransferReceiveStatus = deviceDiv
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
            `Receiving (${(transferredSize / fileSize * 100).toFixed(1)}%)`;
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
ipcRenderer.on("add-device", (_, deviceAddress, deviceToken, deviceName) => {
  document.getElementById("no-devices-connected").classList.add("hidden");

  window.connectedDevices[deviceAddress] = new Device({
    address: deviceAddress,
    token: deviceToken,
    deviceName,
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

    document.getElementById("no-device-selected").classList.add("hidden");
    document.getElementById("status-section").classList.remove("hidden");

    updateUi(deviceAddress);
  });

  const deviceNameDiv = document.createElement("div");
  deviceNameDiv.className = "device-name";
  deviceNameDiv.textContent = deviceName;

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
  newDeviceDiv.append(deviceNameDiv, extraInfoDiv);
  document.getElementById("connected-devices").append(newDeviceDiv);

  // if this is the first device, select it
  if (numberOfConnectedDevices === 1) {
    newDeviceDiv.click();
  }
  updateUi(deviceAddress);
});

ipcRenderer.on("remove-device", (_, deviceAddress) => {
  const device = window.connectedDevices[deviceAddress];
  const deviceDiv = document.getElementById(`device-${device.token}`);
  const deviceIsSelected = deviceDiv.classList.contains("device-selected");

  deviceDiv.remove();
  if (deviceIsSelected) {
    document.getElementById("status-section").classList.add("hidden");
    document.getElementById("no-device-selected").classList.remove("hidden");
  }

  delete window.connectedDevices[deviceAddress];
  if (numberOfConnectedDevices === 0) {
    document.getElementById("no-devices-connected").classList.remove("hidden");
  }
});

ipcRenderer.on("authorise-screenstream", (_, deviceAddress) => {
  const device = window.connectedDevices[deviceAddress];
  device.screenstreamAuthorised = true;
  updateUi(deviceAddress);
});

ipcRenderer.on("update-screenstream-frame", (_, deviceAddress, frame) => {
  const device = window.connectedDevices[deviceAddress];
  device.screenstreamInProgress = true;
  updateUi(deviceAddress);

  const deviceIsSelected = document.getElementById(`device-${device.token}`)
      .classList.contains("device-selected");
  if (deviceIsSelected) {
    document.getElementById("phone-screen").src = `data:image/png;base64,${frame}`;
  }
});

ipcRenderer.on("screenstream-stop", (_, deviceAddress) => {
  const device = window.connectedDevices[deviceAddress];
  device.screenstreamAuthorised = false;
  device.screenstreamInProgress = false;
  updateUi(deviceAddress);
});

ipcRenderer.on("screenstream-new-window-closed", (_, deviceAddress) => {
  const device = window.connectedDevices[deviceAddress];
  device.screenstreamPoppedOut = false;
  updateUi(deviceAddress);
});

ipcRenderer.on("orientation-change", (_, deviceAddress, newOrientation) => {
  const device = window.connectedDevices[deviceAddress];
  device.deviceMetadata = {
    ...device.deviceMetadata,
    orientation: newOrientation,
  };

  updateUi(deviceAddress);
});

ipcRenderer.on("remotecontrol-setting-changed",
    (_, deviceAddress, newRemoteControlSetting) => {
      const device = window.connectedDevices[deviceAddress];
      device.remoteControlEnabled = newRemoteControlSetting;
      updateUi(deviceAddress);
      console.log(`Device at ${deviceAddress} changed remote control setting to ${newRemoteControlSetting}`);
    });

ipcRenderer.on("filetransfer-new-outgoing-files",
    (_, deviceAddress, newOutgoingFiles) => {
      if (newOutgoingFiles.length > 0) {
        const device = window.connectedDevices[deviceAddress];
        device.outgoingFiles = device.outgoingFiles.concat(newOutgoingFiles);
        device.outgoingFilesBatchSize += newOutgoingFiles.length;
        device.sendingFiles = true;

        updateUi(deviceAddress);
        console.log(`New outgoing files to ${deviceAddress}`);
      }
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
      if (newIncomingFiles.length > 0) {
        const device = window.connectedDevices[deviceAddress];
        device.incomingFiles = device.incomingFiles.concat(newIncomingFiles);
        device.incomingFilesBatchSize += newIncomingFiles.length;
        device.receivingFiles = true;

        updateUi(deviceAddress);
        console.log(`New incoming files from ${deviceAddress}:`, newIncomingFiles);
      }
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
