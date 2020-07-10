const sendRawMessage = (message, ws) => {
  ws.send(message);
};

module.exports = sendRawMessage;
