module.exports = {
  messageTypes: {
    GENERIC_MESSAGE: "generic_message",
    INITIAL_AUTH: "initial_auth",
    META_SENDINFO: "meta_sendinfo",

    // screen streaming
    SCREENSTREAM_REQUEST: "screenstream_request",
    SCREENSTREAM_FRAME: "screenstream_frame",
    SCREENSTREAM_ORIENTATIONCHANGE: "screenstream_orientationchange",
    SCREENSTREAM_STOP: "screenstream_stop",

    // remote control
    REMOTECONTROL_TAP: "remotecontrol_tap",
    REMOTECONTROL_BACK: "remotecontrol_back",
    REMOTECONTROL_HOME: "remotecontrol_home",
    REMOTECONTROL_RECENTS: "remotecontrol_recents",

    // file transfer
    FILETRANSFER_TESTRECEIVE: "filetransfer_testreceive",
    FILETRANSFER_BATCH_REQUEST: "filetransfer_batch_request",
    FILETRANSFER_FILE_START: "filetransfer_file_start",
    FILETRANSFER_FILE_END: "filetransfer_file_end",
    FILETRANSFER_DRIVE_LIST_DIR: "filetransfer_drive_list_dir",
    FILETRANSFER_DRIVE_PULL_FILE: "filetransfer_drive_pull_file",
    FILETRANSFER_DRIVE_PUSH_FILE: "filetransfer_drive_push_file",
  },
  responseTypes: {
    GENERIC_MESSAGE_REPLY: "generic_message_reply",
    INITIAL_AUTH_REPLY: "initial_auth_reply",
    META_SENDINFO_REPLY: "meta_sendinfo_reply",

    // screen streaming
    SCREENSTREAM_REQUEST_REPLY: "screenstream_request_reply",

    // file transfer
    FILETRANSFER_BATCH_REQUEST_REPLY: "filetransfer_batch_request_reply",
    FILETRANSFER_DRIVE_LIST_DIR_REPLY: "filetransfer_drive_list_dir_reply",
    FILETRANSFER_DRIVE_PULL_FILE_REPLY: "filetransfer_drive_pull_file_reply",
    FILETRANSFER_DRIVE_PUSH_FILE_REPLY: "filetransfer_drive_push_file_reply",
  },
};
