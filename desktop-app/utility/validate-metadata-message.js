const validateMetadataMessage = (message) => {
  return !!(message.data &&
      message.data.screenDimensions &&
      message.data.screenDimensions.x &&
      message.data.screenDimensions.y &&
      typeof message.data.screenDimensions.x === "number" &&
      typeof message.data.screenDimensions.y === "number");
};

module.exports = validateMetadataMessage;
