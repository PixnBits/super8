const { Raspistill } = require('node-raspistill');
const { EventEmitter } = require('events');

const encoding = 'jpg';

const defaultCameraOptions = {
  noFileSave: true,
  noPreview: true,
  time: 500,
  encoding,
  // defaults to max, 3280 x 2464
  width: 800,
  height: 600,
};
// https://www.npmjs.com/package/node-raspistill#constructoroptions-icameraoptions
const userCameraOptions = {
  // (-100 ... 100). If undefined - raspistill util use contrast 0 value
  contrast: 0,
  // 50 is the default
  // brightness: 50,
  // (-100 ... 100). Raspistill util uses 0 value if undefined
  saturation: 0,
};
const raspistill = new Raspistill(defaultCameraOptions);

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

function setOptions() {
  const settings = { ...userCameraOptions, ...defaultCameraOptions };
  raspistill.setOptions(settings);
  cameraEvents.emit('settings', settings);
}

function isNumber(n) {
  return typeof n === 'number' && !Number.isNaN(n);
}

function setContrast(targetContrast) {
  if (!isNumber) {
    throw new Error('contrast must be a number');
  }
  if (targetContrast > 100 || targetContrast < -100) {
    throw new Error('contrast must be between -100 and 100');
  }
  userCameraOptions.contrast = targetContrast;
  setOptions();
}

function setSaturation(targetSaturation) {
  if (!isNumber) {
    throw new Error('saturation must be a number');
  }
  if (targetSaturation > 100 || targetSaturation < -100) {
    throw new Error('saturation must be between -100 and 100');
  }
  userCameraOptions.saturation = targetSaturation;
  setOptions();
}

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

function restartFrameTimeout() {
  updateFramePeriodically(lastPeriodicInterval);
}

function captureFrame() {
  cancelFrameTimeout();
  const updateFrameChain = updateFrame();

  updateFrameChain
    .catch((err) => console.error(err))
    .then(() => restartFrameTimeout());

  return updateFrameChain;
}

module.exports = {
  getLatestFrame,
  updateFramePeriodically,
  captureFrame,
  setContrast,
  setSaturation,
  // eventing
  addListener: (...args) => cameraEvents.addListener(...args),
  addOnceListener: (...args) => cameraEvents.once(...args),
  removeListener: (...args) => cameraEvents.removeListener(...args),
};
