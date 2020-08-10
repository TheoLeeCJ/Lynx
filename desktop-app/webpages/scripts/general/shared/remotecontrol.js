const getRemoteControlTapPosition = (event, phoneScreen) => {
  const bounds = phoneScreen.getBoundingClientRect();

  const xPixels = Math.round(event.clientX - bounds.x);
  const yPixels = Math.round(event.clientY - bounds.y);
  const position = {
    xOffsetFactor: xPixels / bounds.width,
    yOffsetFactor: yPixels / bounds.height,
  };

  return position;
};
