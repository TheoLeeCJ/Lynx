const sendJsonMessage = require("../utility/send-json-message");
const sendRawMessage = require("../utility/send-raw-message");
const webdav = require("webdav-server").v2;
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
const { VirtualFileSystem } = require("webdav-server/lib/index.v2");
const Path_1 = require("./../node_modules/webdav-server/lib/manager/v2/Path");

let currentPort = 13601;
let currentDriveLetter = 90;
const drives = {};

const startPhoneDriveServer = (key, websocketConnection) => {
  const userManager = new webdav.SimpleUserManager();
  const userObj = userManager.addUser("lynx", "lynxpass", false);

  const privilegeManager = new webdav.SimplePathPrivilegeManager();
  privilegeManager.setRights(userObj, "/", ["all"]);

  drives[key] = {};
  drives[key].started = false;
  drives[key].driveLetter = currentDriveLetter;
  drives[key].currentDirListReady = {};

  drives[key].server = new webdav.WebDAVServer({
    httpAuthentication: new webdav.HTTPDigestAuthentication(userManager, "Lynx Phone Drive"),
    privilegeManager: privilegeManager,
    port: currentPort,
  });

  // VirtualFileSystem.prototype._openReadStream = (path, ctx, callback) => {

  // };

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
      console.log(drives[key].currentDirListReady);
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

  console.log(subTreeToAdd);
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

module.exports = { startPhoneDriveServer, shutdownPhoneDriveServer, folderListingReady, clearAllLynxDrives };
