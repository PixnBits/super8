const { Raspistill } = require('node-raspistill');
const { EventEmitter } = require('events');

const encoding = 'jpg';

const raspistill = new Raspistill({
  noFileSave: true,
  encoding,
  // defaults to max, 3280 x 2464
  width: 800,
  height: 600,
});

const cameraEvents = new EventEmitter();

let latestFrame = null;
let updateFrameHandle = null;
let lastPeriodicInterval = 5;

const getLatestFrame = () => ({ photo: latestFrame, encoding });

function updateFrame() {
  return raspistill.takePhoto().then((photo) => {
    latestFrame = photo;
    cameraEvents.emit('frame', photo);
    return { photo, encoding };
  });
}

function captureFrame() {
  cancelFrameTimeout();
  const updateFrameChain = updateFrame();

  updateFrameChain
    .catch((err) => {
      console.error(err);
      restartFrameTimeout();
    });

  return updateFrameChain;
}

function cancelFrameTimeout() {
  if (updateFrameHandle) {
    clearTimeout(updateFrameHandle);
    updateFrameHandle = null;
    return true;
  }
  return false;
}

function restartFrameTimeout() {
  updateFramePeriodically(lastPeriodicInterval);
}

function updateFramePeriodically(interval = 5) {
  cancelFrameTimeout();
  if (interval <= 0) {
    console.log('frame update canceled');
    return;
  }

  lastPeriodicInterval = interval;
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
  captureFrame,
  // eventing
  addListener: (...args) => cameraEvents.addListener(...args),
  addOnceListener: (...args) => cameraEvents.once(...args),
  removeListener: (...args) => cameraEvents.removeListener(...args),
};
