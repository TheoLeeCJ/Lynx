const sendJsonMessage = require("../utility/send-json-message");
const sendRawMessage = require("../utility/send-raw-message");
const webdav = require("webdav-server").v1;
const uuid = require("uuid").v4;
const fs = require("fs");
const path = require("path");
const mime = require("mime");
const { exec, execSync } = require("child_process");
const {
  AUTH_OK,
  GENERIC_OK,
  BAD_REQUEST,
  INVALID_TOKEN,
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
} = require("./../utility/responses");
const {
  messageTypes: {
    GENERIC_MESSAGE,
    FILETRANSFER_DRIVE_LIST_DIR,
    FILETRANSFER_DRIVE_PULL_FILE,
    FILETRANSFER_DRIVE_PUSH_FILE,
  },
} = require("./../utility/message-types");

let currentPort = 13601;
let currentDriveLetter = 90;
const allResources = [];
const currentWebdavCallbacks = {};
const drives = {};

const startPhoneDriveServer = (key, websocketConnection) => {
  const user = uuid();
  const pass = uuid();

  // const userManager = new webdav.SimpleUserManager();
  // const userObj = userManager.addUser(user, pass, false);

  drives[key] = {};
  drives[key].started = false;
  drives[key].server = new webdav.WebDAVServer({
    // httpAuthentication: new webdav.HTTPDigestAuthentication(userManager, "Lynx Phone Drive"),
    port: currentPort,
  });

  drives[key].driveLetter = currentDriveLetter;

  sendJsonMessage({
    type: FILETRANSFER_DRIVE_LIST_DIR,
    data: {
      path: "/",
      resourceIndex: -1,
    },
  }, websocketConnection);

  drives[key].server.start(() => {
    // mount localhost drive in File Explorer
    exec(`net use ${String.fromCharCode(currentDriveLetter)}: "http://127.0.0.1:${currentPort}"`, () => {
      exec(`powershell -command "(New-Object -ComObject shell.application).NameSpace('${String.fromCharCode(currentDriveLetter)}:\\').self.name = 'Phone (EXPERIMENTAL)'"`, () => {
        exec(`explorer.exe Z:\\`, () => {});
        currentPort++;
        currentDriveLetter--;
      });
    });
  });
};

const folderListingReady = (key, websocketConnection, fullMessage) => {
  if (drives[key] === undefined) return;
  const folderListing = fullMessage.data;

  if (!drives[key].started) {
    console.log("Creating initial root directory");
    drives[key].started = true;

    drives[key].resourceTree = [];

    folderListing.forEach((item, index) => {
      if (item[1] === "folder") {
        const folder = new webdav.VirtualFolder(item[0].replace(/ /g, "__"));
        folder.lynxPath = "/" + folder.name.replace(/__/g, " ");
        folder.dateLastModified = new Date(item[2]);

        folder.resourceIndex = allResources.length;
        allResources.push(folder);

        folder.getChildren = (childrenCallback) => {
          console.log("Request directory listing for " + folder.lynxPath);
          sendJsonMessage({
            type: FILETRANSFER_DRIVE_LIST_DIR,
            data: {
              path: folder.lynxPath,
              resourceIndex: folder.resourceIndex,
            },
          }, websocketConnection);
          currentWebdavCallbacks[folder.resourceIndex] = childrenCallback;
        };

        drives[key].resourceTree.push({
          r: folder,
        });
      } else {
        const file = new webdav.VirtualFile(item[0]);
        file.dateLastModified = new Date(item[2]);
        drives[key].resourceTree.push({
          r: file,
        });
      }
    });

    drives[key].resourceTree.push(new webdav.VirtualFolder("__CURRENTLY ONLY SUPPORT FOLDER BROWSING DUE TO LIMITATIONS OF LIBRARY"));
    drives[key].server.addResourceTree(drives[key].resourceTree);
  } else {
    const resourceList = [];

    folderListing.forEach((item, index) => {
      if (item[1] === "folder") {
        const folder = new webdav.VirtualFolder(item[0].replace(/ /g, "__"));
        folder.lynxPath = fullMessage.path + "/" + folder.name.replace(/__/g, " ");
        folder.parent = allResources[fullMessage.resourceIndex];
        folder.dateLastModified = new Date(item[2]);

        folder.resourceIndex = allResources.length;
        allResources.push(folder);

        folder.getChildren = (childrenCallback) => {
          console.log("Request directory listing for " + folder.lynxPath);
          sendJsonMessage({
            type: FILETRANSFER_DRIVE_LIST_DIR,
            data: {
              path: folder.lynxPath,
              resourceIndex: folder.resourceIndex,
            },
          }, websocketConnection);
          currentWebdavCallbacks[folder.resourceIndex] = childrenCallback;
        };
        resourceList.push(folder);
      } else {
        const file = new webdav.VirtualFile(item[0]);
        file.dateLastModified = new Date(item[2]);
        file.parent = allResources[fullMessage.resourceIndex];
        resourceList.push(file);
      }
    });

    currentWebdavCallbacks[fullMessage.resourceIndex](null, resourceList);
  }
};

const shutdownPhoneDriveServer = (key, websocketConnection) => {
  exec(`net use ${String.fromCharCode(drives[key].driveLetter)}: /delete`, () => {});
};

const clearAllLynxDrives = () => {
  console.log("Clearing up Lynx-related network drives...");
  Object.keys(drives).forEach((key) => {
    exec(`net use ${String.fromCharCode(drives[key].driveLetter)}: /delete`, () => {});
  });
};

module.exports = { startPhoneDriveServer, shutdownPhoneDriveServer, folderListingReady, clearAllLynxDrives };
