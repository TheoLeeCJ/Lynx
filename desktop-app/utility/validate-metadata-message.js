const validateMetadataMessage = (message) => {
  return !!(message.data &&

      // phone screen dimensions
      message.data.screenDimensions &&
      message.data.screenDimensions.screenWidth &&
      message.data.screenDimensions.screenHeight &&
      typeof message.data.screenDimensions.screenWidth === "number" &&
      typeof message.data.screenDimensions.screenHeight === "number" &&

      // screen stream image dimensions
      message.data.screenStreamImageDimensions &&
      message.data.screenStreamImageDimensions.imageWidth &&
      message.data.screenStreamImageDimensions.imageHeight &&
      typeof message.data.screenStreamImageDimensions.imageWidth === "number" &&
      typeof message.data.screenStreamImageDimensions.imageHeight === "number");
};

module.exports = validateMetadataMessage;
