const sendJsonMessage = require("../utility/send-json-message");
const sendRawMessage = require("../utility/send-raw-message");
const webdav = require("webdav-server").v2;
const fs = require("fs");
const path = require("path");
const mime = require("mime");
const streamLib = require("stream");
const { exec } = require("child_process");
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
const { VirtualFileSystem } = require("webdav-server/lib/index.v2");
const Path_1 = require("./../node_modules/webdav-server/lib/manager/v2/Path");
const { count } = require("console");

let currentPort = 13601;
let currentDriveLetter = 90;
const drives = {};
let expectingFileReceive = false;
const counterActWindowsExplorer = 0;

const checkDriveTriggeredFileReceive = () => {
  return expectingFileReceive;
};

const startPhoneDriveServer = (key, websocketConnection) => {
  const userManager = new webdav.SimpleUserManager();
  const userObj = userManager.addUser("lynx", "lynxpass", false);

  const privilegeManager = new webdav.SimplePathPrivilegeManager();
  privilegeManager.setRights(userObj, "/", ["all"]);

  drives[key] = {};
  drives[key].websocket = websocketConnection;
  drives[key].started = false;
  drives[key].driveLetter = currentDriveLetter;
  drives[key].currentDirListReady = {};
  drives[key].currentFileBuffer = null;
  drives[key].fileSizes = {};
  drives[key].pendingFileReceives = []; // unused as of now

  drives[key].server = new webdav.WebDAVServer({
    httpAuthentication: new webdav.HTTPDigestAuthentication(userManager, "Lynx Phone Drive"),
    privilegeManager: privilegeManager,
    port: currentPort,
  });

  drives[key].server.lynxKey = key;

  VirtualFileSystem.prototype._openReadStream = (path, ctx, callback) => {
    const vfs = ctx.context.server.rootFileSystem();

    const resource = vfs.resources[path.toString()];
    if (resource === undefined) {
      return callback(Errors_1.Errors.ResourceNotFound);
    }

    sendJsonMessage({
      type: FILETRANSFER_DRIVE_PULL_FILE,
      path: path.toString(),
    }, drives[ctx.context.server.lynxKey].websocket);

    expectingFileReceive = ctx.context.server.lynxKey;
    drives[key].currentFileBuffer = null;

    function checkFileBufferReady() {
      if (drives[key].currentFileBuffer) {
        // console.log(drives[key].currentFileBuffer);
        // resource.content = new Buffer.from(drives[key].currentFileBuffer);
        callback(null, new streamLib.Readable({
          read() {
            this.push(drives[key].currentFileBuffer);
          },
        }));
      } else {
        setTimeout(checkFileBufferReady, 100);
      }
    }

    setTimeout(checkFileBufferReady, 100);
  };

  VirtualFileSystem.prototype._size = (path, ctx, callback) => {
    callback(null, drives[ctx.context.server.lynxKey].fileSizes[path]);
  };

  VirtualFileSystem.prototype._readDir = (path, ctx, callback) => {
    drives[key].currentDirListReady[path] = 0;
    console.log("Request " + path);

    const vfs = ctx.context.server.rootFileSystem();

    sendJsonMessage({
      type: FILETRANSFER_DRIVE_LIST_DIR,
      data: {
        path: path.toString(),
        resourceIndex: -1,
      },
    }, websocketConnection);

    function checkDirListReady() {
      console.log("CHECK DIR LIST READY?!");
      if (drives[key].currentDirListReady[path] >= 2) {
        const base = path.toString(true);
        const children = [];
        for (const subPath in vfs.resources) {
          if (subPath.startsWith(base)) {
            const pSubPath = new Path_1.Path(subPath);
            if (pSubPath.paths.length === path.paths.length + 1) {
              children.push(pSubPath);
            }
          }
        }

        callback(null, children);
      } else {
        setTimeout(checkDirListReady, 100);
      }
    }

    setTimeout(checkDirListReady, 100);
  };

  drives[key].server.start(() => {
    // mount localhost drive in File Explorer
    exec(`net use ${String.fromCharCode(currentDriveLetter)}: "http://127.0.0.1:${currentPort}" lynxpass /user:lynx`, () => {
      exec(`powershell -command "(New-Object -ComObject shell.application).NameSpace('${String.fromCharCode(currentDriveLetter)}:\\').self.name = 'Phone (EXPERIMENTAL)'"`, () => {
        exec(`explorer.exe ${String.fromCharCode(currentDriveLetter)}:\\`, () => {});
        currentPort++;
        currentDriveLetter--;
      });
    });
  });
};

const passReceivedBuffer = (buffer) => {
  console.log("WebDAV script has received buffer...");
  drives[expectingFileReceive].currentFileBuffer = buffer;
  expectingFileReceive = false;
};

const folderListingReady = (key, websocketConnection, fullMessage) => {
  console.log("receive folder listing");
  if (drives[key] === undefined) return;
  const folderListing = fullMessage.data;
  let itemsProcessed = 0;

  const subTreeToAdd = {};
  folderListing.forEach((item) => {
    if (item[1] === "folder") {
      drives[key].server.rootFileSystem().fastExistCheck(drives[key].server.createExternalContext(), `${fullMessage.path + item[0]}`, (exists) => {
        if (!exists) {
          subTreeToAdd[item[0]] = {};
        }
        itemsProcessed++;
      });
    } else {
      drives[key].server.rootFileSystem().fastExistCheck(drives[key].server.createExternalContext(), `${fullMessage.path}/${item[0]}`, (exists) => {
        if (!exists) {
          drives[key].server.rootFileSystem().create(drives[key].server.createExternalContext(), `${fullMessage.path}/${item[0]}`, webdav.ResourceType.File, (e) => {
            if (e) console.log(e);
            drives[key].fileSizes[`${fullMessage.path}/${item[0]}`] = item[3];
            itemsProcessed++;

            if (itemsProcessed === fullMessage.data.length) {
              drives[key].currentDirListReady[fullMessage.path]++;
            }
          });
        } else {
          itemsProcessed++;
        }
      });
    }
  });

  drives[key].server.rootFileSystem().addSubTree(drives[key].server.createExternalContext(), `${fullMessage.path}`, subTreeToAdd, (e) => {
    if (e) console.log(e);
    drives[key].currentDirListReady[fullMessage.path]++;
  });

  drives[key].currentDirListReady[fullMessage.path]++;
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

module.exports = { startPhoneDriveServer, shutdownPhoneDriveServer, folderListingReady, clearAllLynxDrives, checkDriveTriggeredFileReceive, passReceivedBuffer };
