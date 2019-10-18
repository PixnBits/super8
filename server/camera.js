const { Raspistill } = require('node-raspistill');
const { EventEmitter } = require('events');

const isNumber = require('./utils/isNumber');

const encoding = 'jpg';

const defaultCameraOptions = {
  noFileSave: true,
  noPreview: true,
  time: 1, // 0 doesn't work, but we can make this small to avoid unneeded delay
  encoding,
  // defaults to max, 3280 x 2464
  width: 800,
  height: 600,
};
// https://www.npmjs.com/package/node-raspistill#constructoroptions-icameraoptions
const userCameraOptions = {
  // (-100 ... 100). If undefined - raspistill util use contrast 0 value
  contrast: 0,
  // 50 is the default, 0 to 100 per raspistill binary
  brightness: 50,
  // (-100 ... 100). Raspistill util uses 0 value if undefined
  saturation: 0,
};
const raspistill = new Raspistill(defaultCameraOptions);

const cameraEvents = new EventEmitter();

let cameraCurrentOperation = Promise.resolve();

function setOptions() {
  cameraCurrentOperation = cameraCurrentOperation
    .then(() => {
      const settings = { ...userCameraOptions, ...defaultCameraOptions };
      console.log('camera: setOptions');
      raspistill.setOptions(settings);
      cameraEvents.emit('settings', settings);
    });
  return cameraCurrentOperation;
}

function setContrast(targetContrast) {
  if (!isNumber) {
    throw new Error('contrast must be a number');
  }
  if (targetContrast > 100 || targetContrast < -100) {
    throw new Error('contrast must be between -100 and 100');
  }
  userCameraOptions.contrast = targetContrast;
  return setOptions();
}

function setSaturation(targetSaturation) {
  if (!isNumber) {
    throw new Error('saturation must be a number');
  }
  if (targetSaturation > 100 || targetSaturation < -100) {
    throw new Error('saturation must be between -100 and 100');
  }
  userCameraOptions.saturation = targetSaturation;
  return setOptions();
}

function setBrightness(targetBrightness) {
  if (!isNumber) {
    throw new Error('brightness must be a number');
  }
  if (targetBrightness > 100 || targetBrightness < 0) {
    throw new Error('brightness must be between 0 and 100');
  }
  userCameraOptions.brightness = targetBrightness;
  return setOptions();
}

let latestFrame = null;

function getLatestFrame() {
  return {
    photo: latestFrame,
    encoding,
  };
}

function captureFrame() {
  cameraEvents.emit('frameQueued');
  cameraCurrentOperation = cameraCurrentOperation
    .then(() => raspistill.takePhoto())
    .then((photo) => {
      latestFrame = photo;
      cameraEvents.emit('frame', photo);
      return { photo, encoding };
    });

  return cameraCurrentOperation;
}

let frameLastQueued = 0;
cameraEvents.on('frameQueued', () => { frameLastQueued = Date.now(); });

function queueCaptureFrameCallback(intervalMS) {
  return () => {
    if (Date.now() - frameLastQueued < intervalMS) {
      return;
    }
    captureFrame();
  };
}

let frameUpdateIntervalHandle = null;
function updateFramePeriodically(interval = 5e3) {
  if (!isNumber(interval)) {
    throw new Error('interval must be a number');
  }

  if (interval <= 0) {
    throw new Error('interval must be >= 0');
  }

  console.log(`changing frame updates to ${interval}s`);
  if (frameUpdateIntervalHandle) {
    clearInterval(frameUpdateIntervalHandle);
    frameUpdateIntervalHandle = null;
  }

  frameUpdateIntervalHandle = setInterval(queueCaptureFrameCallback(interval), interval);
  // don't keep node running just for this update (should be the listening on a port instead)
  frameUpdateIntervalHandle.unref();
}

module.exports = {
  getLatestFrame,
  updateFramePeriodically,
  captureFrame,
  setContrast,
  setSaturation,
  setBrightness,
  // eventing
  addListener: (...args) => cameraEvents.addListener(...args),
  addOnceListener: (...args) => cameraEvents.once(...args),
  removeListener: (...args) => cameraEvents.removeListener(...args),
};
