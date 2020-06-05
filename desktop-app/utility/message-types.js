module.exports = {
  messageTypes: {
    GENERIC_MESSAGE: "generic_message",
    INITIAL_AUTH: "initial_auth",
    SCREENSTREAM_REQUEST: "screenstream_request",
    SCREENSTREAM_FRAME: "screenstream_frame",
    META_SENDINFO: "meta_sendinfo",

    // remote control
    REMOTECONTROL_TAP: "remotecontrol_tap",
    REMOTECONTROL_BACK: "remotecontrol_back",
    REMOTECONTROL_HOME: "remotecontrol_home",
    REMOTECONTROL_RECENTS: "remotecontrol_recents",

    // file transfer
    FILETRANSFER_TESTRECEIVE: "filetransfer_testreceive",
  },
  responseTypes: {
    GENERIC_MESSAGE_REPLY: "generic_message_reply",
    INITIAL_AUTH_REPLY: "initial_auth_reply",
    SCREENSTREAM_REQUEST_REPLY: "screenstream_request_reply",
    META_SENDINFO_REPLY: "meta_sendinfo_reply",
  },
};
