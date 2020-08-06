const sendJsonMessage = (message, ws, callback = () => {}) => {
  ws.send(JSON.stringify(message), callback());
};

module.exports = sendJsonMessage;
