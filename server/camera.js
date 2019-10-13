const { Raspistill } = require('node-raspistill');
const { EventEmitter } = require('events');

const raspistill = new Raspistill({
  noFileSave: true,
  encoding: 'jpg',
  // defaults to max, 3280 x 2464
  width: 800,
  height: 600,
});

const cameraEvents = new EventEmitter();

let latestFrame = null;

const getLatestFrame = () => latestFrame;

function updateFrame() {
  return raspistill.takePhoto().then((photo) => {
    latestFrame = photo;
    cameraEvents.emit('frame', photo);
  });
}

let updateFrameHandle = null;
function cancelFrameTimeout() {
  if (updateFrameHandle) {
    clearTimeout(updateFrameHandle);
    updateFrameHandle = null;
    return true;
  }
  return false;
}

function updateFramePeriodically(interval = 5) {
  cancelFrameTimeout();
  if (interval <= 0) {
    console.log('frame update canceled');
    return;
  }

  const intervalMS = interval * 1e3;
  console.log(`changing frame updates to ${interval}s`);

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
  addListener: (...args) => cameraEvents.addListener(...args),
  addOnceListener: (...args) => cameraEvents.once(...args),
  removeListener: (...args) => cameraEvents.removeListener(...args),
};
