const validateMetadataMessage = (message) => {
  const metadata = message.data;

  return !!(
    (metadata &&
    typeof metadata === "object") &&

    // phone screen dimensions
    (metadata.screenDimensions &&
    typeof metadata.screenDimensions.screenWidth === "number" &&
    typeof metadata.screenDimensions.screenHeight === "number") &&

    // screen stream image dimensions
    (metadata.screenstreamImageDimensions &&
    typeof metadata.screenstreamImageDimensions.imageWidth === "number" &&
    typeof metadata.screenstreamImageDimensions.imageHeight === "number") &&

    // phone orientation
    (metadata.orientation === "portrait" ||
    metadata.orientation === "landscape")
  );
};

module.exports = validateMetadataMessage;
