const uuid = require("uuid").v4;
const { BrowserWindow, dialog } = require("electron");
const { setFileReceiveState } = require("./filetransfer/receive");
const { sendFiles } = require("./filetransfer/send");
const path = require("path");
const fs = require("fs");
const { startPhoneDriveServer, folderListingReady, setDriveReceiveState } = require("./filetransfer/drive");
const {
  AUTH_OK,
  GENERIC_OK,
  BAD_REQUEST,
  INVALID_TOKEN,
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
} = require("./utility/responses");
const {
  messageTypes: {
    GENERIC_MESSAGE,
    INITIAL_AUTH,
    SCREENSTREAM_REQUEST,
    SCREENSTREAM_FRAME,
    SCREENSTREAM_ORIENTATIONCHANGE,
    SCREENSTREAM_STOP,
    REMOTECONTROL_ENABLED,
    REMOTECONTROL_DISABLED,
    META_SENDINFO,
    FILETRANSFER_TESTRECEIVE,
    FILETRANSFER_BATCH_REQUEST,
    FILETRANSFER_FILE_START,
    FILETRANSFER_FILE_END,
  },
  responseTypes: {
    GENERIC_MESSAGE_REPLY,
    INITIAL_AUTH_REPLY,
    FILETRANSFER_BATCH_REQUEST_REPLY,
    SCREENSTREAM_REQUEST_REPLY,
    META_SENDINFO_REPLY,
    FILETRANSFER_DRIVE_LIST_DIR_REPLY,
    FILETRANSFER_DRIVE_PULL_FILE_REPLY,
    FILETRANSFER_DRIVE_PUSH_FILE_REPLY,
  },
} = require("./utility/message-types");
const sendJsonMessage = require("./utility/send-json-message");
const makeConnectionInfoQrCode = require("./utility/make-connection-info-qr-code");
const Device = require("./utility/classes/Device");
const { pathToFileURL } = require("url");

const routeMessage = async (message, ws, req) => {
  if (typeof message.type !== "string" || !message.type.trim()) {
    sendJsonMessage({ type: INITIAL_AUTH_REPLY, ...BAD_REQUEST }, ws);
  }

  if (!(req.socket.remoteAddress in global.connectedDevices) &&
        message.type !== INITIAL_AUTH) {
    console.log("Received message from UNAUTHENTICATED DEVICE (should not happen):", message);
    return;
  }

  if (message.type === SCREENSTREAM_FRAME) {
    console.log("Received screen stream frame");
  } else if (message.type === FILETRANSFER_TESTRECEIVE) {
    console.log("Received file");
  } else {
    console.log("Received message:", message);
  }

  switch (message.type) {
    case INITIAL_AUTH:
      if (message.data.token === global.connectionToken) {
        global.connectedDevices[req.socket.remoteAddress] = new Device({
          address: req.socket.remoteAddress,
          deviceName: message.data.identification,
          token: global.connectionToken,
          webSocketConnection: ws,
        });

        // add device to app window's devices list (addresses and tokens only)
        global.mainWindow.webContents.send("add-device", req.socket.remoteAddress,
            global.connectionToken, message.data.identification);

        // update connection token
        global.connectionToken = uuid();

        // send new connection info QR code to app window
        global.mainWindow.webContents.send("update-connection-info-qr-code",
            makeConnectionInfoQrCode());

        // start the WebDAV server responsible for mapping drive to phone's filesystem
        startPhoneDriveServer(req.socket.remoteAddress, ws);

        sendJsonMessage({ type: INITIAL_AUTH_REPLY, ...AUTH_OK }, ws);
      } else {
        sendJsonMessage({ type: INITIAL_AUTH_REPLY, ...INVALID_TOKEN }, ws);
        ws.close();
      }
      break;

    case FILETRANSFER_DRIVE_LIST_DIR_REPLY:
      folderListingReady(req.socket.remoteAddress, ws, message);
      break;

    case FILETRANSFER_DRIVE_PULL_FILE_REPLY:
      break;

    case FILETRANSFER_DRIVE_PUSH_FILE_REPLY:
      break;

    case SCREENSTREAM_REQUEST:
      const { response: clickedButton } = await dialog.showMessageBox(global.mainWindow, {
        title: "A device is asking to share its screen",
        message: `The device at ${req.socket.remoteAddress} is asking to share ` +
                 "its screen and enable remote control features.",
        buttons: ["&Allow", "&Deny"],
        cancelId: 1, // if user presses Esc, "Deny" is automatically selected
        noLink: true, // disable big buttons
      });

      if (clickedButton === 0) { // user clicked "Allow"
        global.connectedDevices[req.socket.remoteAddress]
            .screenstreamAuthorised = true;
        global.connectedDevices[req.socket.remoteAddress].screenstreamWindow =
            global.mainWindow;
        global.mainWindow.webContents.send("authorise-screenstream",
            req.socket.remoteAddress);

        sendJsonMessage({ type: SCREENSTREAM_REQUEST_REPLY, ...GENERIC_OK }, ws);
      } else {
        sendJsonMessage({ type: SCREENSTREAM_REQUEST_REPLY, ...FORBIDDEN }, ws);
      }
      break;

    case SCREENSTREAM_FRAME:
      if (req.socket.remoteAddress in global.connectedDevices &&
          global.connectedDevices[req.socket.remoteAddress].screenstreamAuthorised) {
        if (message.data && message.data.frame && typeof message.data.frame === "string") {
          global.connectedDevices[req.socket.remoteAddress].screenstreamWindow
              .webContents.send("update-screenstream-frame",
                  req.socket.remoteAddress,
                  message.data.frame);
        } else {
          sendJsonMessage({ type: GENERIC_MESSAGE_REPLY, ...BAD_REQUEST }, ws);
        }
      } else {
        sendJsonMessage({ type: GENERIC_MESSAGE_REPLY, ...FORBIDDEN }, ws);
      }
      break;

    case SCREENSTREAM_STOP:
      global.connectedDevices[req.socket.remoteAddress].screenstreamAuthorised =
          false;
      global.mainWindow.webContents.send("screenstream-stop",
          req.socket.remoteAddress);
      break;

    case REMOTECONTROL_ENABLED:
      global.mainWindow.webContents.send("remotecontrol-setting-changed",
          req.socket.remoteAddress, true);
      break;

    case REMOTECONTROL_DISABLED:
      global.mainWindow.webContents.send("remotecontrol-setting-changed",
          req.socket.remoteAddress, false);
      break;

    case META_SENDINFO:
      if (req.socket.remoteAddress in global.connectedDevices) {
        const validateMetadataMessage = require("./utility/validate-metadata-message");
        if (validateMetadataMessage(message)) {
          const device = global.connectedDevices[req.socket.remoteAddress];
          device.deviceMetadata = { ...device.deviceMetadata, ...message.data };

          sendJsonMessage({ type: META_SENDINFO_REPLY, ...GENERIC_OK }, ws);
        } else {
          sendJsonMessage({ type: META_SENDINFO_REPLY, ...BAD_REQUEST }, ws);
        }
      } else {
        sendJsonMessage({ type: SCREENSTREAM_REQUEST_REPLY, ...FORBIDDEN }, ws);
      }
      break;

    case FILETRANSFER_BATCH_REQUEST:
      // TODO: validate file transfer request message
      // TODO: extract dialog showing to separate function & file
      const filenames = message.data.files.map((file) => file.filename);
      dialog.showMessageBox(global.mainWindow, {
        title: "A device wants to share files",
        message: `The device at ${req.socket.remoteAddress} is asking to share ` +
                 `these files with you:\n\n${filenames.join("\n")}`,
        buttons: ["&Allow", "&Deny"],
        cancelId: 1, // if user presses Esc, "Deny" is automatically selected
        noLink: true, // disable big buttons
      }).then(({ response: clickedButton }) => {
        if (clickedButton === 0) { // user clicked "Allow"
          const homeDir = require("os").homedir();
          const device = global.connectedDevices[req.socket.remoteAddress];
          const newIncomingFiles = message.data.files.map(({ filename, fileSize }) => ({
            filename,
            // TODO: let user customise file save destination
            filePath: path.join(homeDir, "Documents/Lynx", filename),
            fileSize,
            transferredSize: 0,
          }));
          device.incomingFiles = device.incomingFiles.concat(newIncomingFiles);
          global.mainWindow.webContents.send("filetransfer-new-incoming-files",
              req.socket.remoteAddress, newIncomingFiles);
          sendJsonMessage({ type: FILETRANSFER_BATCH_REQUEST_REPLY, ...GENERIC_OK }, ws);
        } else {
          sendJsonMessage({ type: FILETRANSFER_BATCH_REQUEST_REPLY, ...FORBIDDEN }, ws);
        }
      });
      break;

    case FILETRANSFER_FILE_START:
      if (message.data.fileID === undefined) {
        setFileReceiveState(req.socket.remoteAddress, message.data);
      } else {
        setDriveReceiveState(req.socket.remoteAddress, message.data);
      }
      break;

    case FILETRANSFER_FILE_END:
      if (message.data.fileID === undefined) {
        setFileReceiveState(req.socket.remoteAddress, null);
      } else {
        setDriveReceiveState(req.socket.remoteAddress, null);
      }
      break;

    case FILETRANSFER_BATCH_REQUEST_REPLY:
      console.log(FILETRANSFER_BATCH_REQUEST_REPLY);
      if (message.data.success) sendFiles(req.socket.remoteAddress);
      break;

    case SCREENSTREAM_ORIENTATIONCHANGE:
      const device = global.connectedDevices[req.socket.remoteAddress];
      if (message.data.orientation === device.deviceMetadata.orientation) {
        break;
      }

      device.deviceMetadata.orientation = message.data.orientation;
      if (device.screenstreamPoppedOut) {
        // swap window's width & height
        const [currentWidth] = device.screenstreamNewWindow.getSize();
        // TODO: use
        // device.deviceMetadata.screenstreamImageDimensions[device
        //     .deviceMetadata.orientation]
        // after it's implemented
        const { imageWidth, imageHeight } = device.deviceMetadata
            .screenstreamImageDimensions;
        const newWidth = Math.round(currentWidth * (
          device.deviceMetadata.orientation === "portrait" ?
              imageWidth / imageHeight :
              imageHeight / imageWidth
        ));
        const newHeight = currentWidth;
        // win.setSize() is broken, calling win.setMinimumSize() before it is a workaround
        device.screenstreamNewWindow.setMinimumSize(newWidth, newHeight);
        device.screenstreamNewWindow.setSize(newWidth, newHeight);
      }

      global.mainWindow.webContents.send("orientation-change",
          req.socket.remoteAddress, message.data.orientation);
      break;

    default: // matched no message types - invalid
      sendJsonMessage({ type: GENERIC_MESSAGE_REPLY, ...BAD_REQUEST }, ws);
  }
};

module.exports = routeMessage;
