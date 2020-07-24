const sendRawMessage = (message, ws, callback = () => {}) => {
  ws.send(message, callback);
};

module.exports = sendRawMessage;
