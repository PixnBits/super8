const { Raspistill } = require('node-raspistill');
// const fs = require('fs');

const raspistill = new Raspistill({
  noFileSave: true,
  encoding: 'jpg',
  // defaults to max, 3280 x 2464
  width: 800,
  height: 600,
});

let latestFrame = null;

const getLatestFrame = () => latestFrame;

function updateFrame() {
  return raspistill.takePhoto().then((photo) => { latestFrame = photo; });
}

let updateFrameHandle = null;
function updateFramePeriodically(interval = 5) {
  if (updateFrameHandle) {
    clearTimeout(updateFrameHandle);
  }

  const intervalMS = interval * 1e3;

  function timeoutUpdate() {
    updateFrame()
      .then(() => { updateFrameHandle = setTimeout(timeoutUpdate, intervalMS); })
      .catch(() => { updateFrameHandle = setTimeout(timeoutUpdate, intervalMS); });
  }

  timeoutUpdate();
}

module.exports = {
  getLatestFrame,
  updateFramePeriodically,
};
