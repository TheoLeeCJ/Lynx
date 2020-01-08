const sendJsonMessage = (message, ws) => {
  ws.send(JSON.stringify(message));
};

module.exports = sendJsonMessage;
