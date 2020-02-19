const validateMetadataMessage = (message) => {
  return !!(message.data &&

      // phone screen dimensions
      message.data.screenDimensions &&
      message.data.screenDimensions.screenWidth &&
      message.data.screenDimensions.screenHeight &&
      typeof message.data.screenDimensions.screenWidth === "number" &&
      typeof message.data.screenDimensions.screenHeight === "number" &&

      // screen stream image dimensions
      message.data.screenstreamImageDimensions &&
      message.data.screenstreamImageDimensions.imageWidth &&
      message.data.screenstreamImageDimensions.imageHeight &&
      typeof message.data.screenstreamImageDimensions.imageWidth === "number" &&
      typeof message.data.screenstreamImageDimensions.imageHeight === "number");
};

module.exports = validateMetadataMessage;
