const { Raspistill } = require('node-raspistill');
const { EventEmitter } = require('events');

const sharp = require('sharp');

const settings = require('./settings');
const isNumber = require('./utils/isNumber');

const defaultCameraOptions = {
  noFileSave: true,
  noPreview: true,
  time: 1, // 0 doesn't work, but we can make this small to avoid unneeded delay
  // encoding: 'png', // not hardware accelerated, and it's noticable
  encoding: 'jpg', // hardware accelerated
  quality: 100,
  // defaults to max, 3280 x 2464
  // width: 800,
  // height: 600,
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
      const cameraSettings = { ...userCameraOptions, ...defaultCameraOptions };
      console.log('camera: setOptions');
      raspistill.setOptions(cameraSettings);
      cameraEvents.emit('settings', cameraSettings);
    });
  return cameraCurrentOperation;
}

function setContrast(targetContrast) {
  if (!isNumber(targetContrast)) {
    throw new Error('contrast must be a number');
  }
  if (targetContrast > 100 || targetContrast < -100) {
    throw new Error('contrast must be between -100 and 100');
  }
  userCameraOptions.contrast = targetContrast;
  return setOptions();
}

function setSaturation(targetSaturation) {
  if (!isNumber(targetSaturation)) {
    throw new Error('saturation must be a number');
  }
  if (targetSaturation > 100 || targetSaturation < -100) {
    throw new Error('saturation must be between -100 and 100');
  }
  userCameraOptions.saturation = targetSaturation;
  return setOptions();
}

function setBrightness(targetBrightness) {
  if (!isNumber(targetBrightness)) {
    throw new Error('brightness must be a number');
  }
  if (targetBrightness > 100 || targetBrightness < 0) {
    throw new Error('brightness must be between 0 and 100');
  }
  userCameraOptions.brightness = targetBrightness;
  return setOptions();
}

let cropWindow;
// lots of input validation
/* eslint-disable-next-line complexity */
function setCropWindow(
  {
    left, top, width, height,
  },
  skipSave = false
) {
  if (!isNumber(left)) {
    throw new Error('left must be a number');
  }
  if (!isNumber(top)) {
    throw new Error('top must be a number');
  }
  if (!isNumber(width)) {
    throw new Error('width must be a number');
  }
  if (!isNumber(height)) {
    throw new Error('height must be a number');
  }
  const usableLeft = Math.max(0, Math.floor(left));
  const usableTop = Math.max(0, Math.floor(top));
  const widthCeil = Math.ceil(Math.abs(width));
  // dimensions for video need to be factors of 2
  const dimensionedWidth = widthCeil % 2 ? Math.ceil(widthCeil / 2) * 2 : widthCeil;
  const heightCeil = Math.ceil(Math.abs(height));
  const dimensionedHeight = heightCeil % 2 ? Math.ceil(heightCeil / 2) * 2 : heightCeil;
  const usableWidth = usableLeft + dimensionedWidth > defaultCameraOptions.width ? (
    defaultCameraOptions.width - usableLeft
  ) : (
    dimensionedWidth
  );
  const usableHeight = usableTop + dimensionedHeight > defaultCameraOptions.height ? (
    defaultCameraOptions.height - usableTop
  ) : (
    dimensionedHeight
  );

  if (usableLeft >= defaultCameraOptions.width) {
    throw new Error('x must be in the image dimensions');
  }
  if (usableTop >= defaultCameraOptions.height) {
    throw new Error('y must be in the image dimensions');
  }
  if (usableWidth <= 0) {
    throw new Error('width must be greater than zero');
  }
  if (usableWidth <= 0) {
    throw new Error('width must be greater than zero');
  }

  cropWindow = {
    left: usableLeft,
    top: usableTop,
    width: usableWidth,
    height: usableHeight,
  };
  cameraEvents.emit('cropWindow', { ...cropWindow });
  if (!skipSave) {
    settings.set('cropWindow', cropWindow);
  }
}
setCropWindow({
  // left: 0, top: 0, width: Infinity, height: Infinity,
  left: 0, top: 0, width: 3280, height: 2464,
}, true);
settings.addListener('set:cropWindow', (window) => setCropWindow(window, true));

let latestFrame = null;

function getLatestFrame() {
  return { ...latestFrame };
}

function toBufferWithInfo(photo) {
  return new Promise((res, rej) => {
    sharp(photo).toBuffer((err, buffer, info) => {
      if (err) {
        rej(err);
      } else {
        res({ buffer, info });
      }
    });
  });
}

function takePhoto() {
  cameraEvents.emit('frameQueued');
  cameraCurrentOperation = cameraCurrentOperation
    .then(() => raspistill.takePhoto())
    .then(toBufferWithInfo)
    .then(({ buffer, info: { format, width, height } }) => {
      latestFrame = {
        photo: buffer,
        encoding: format,
        size: {
          width,
          height,
        },
      };
      cameraEvents.emit('frame', latestFrame);
      return latestFrame;
    });

  return cameraCurrentOperation;
}

function captureFrame() {
  return takePhoto()
    .then(({ photo, encoding }) => sharp(photo)
      .extract(cropWindow)
      .toBuffer()
      .then((croppedPhoto) => ({
        photo: croppedPhoto,
        encoding,
        size: cropWindow,
      }))
    );
}

let periodicCapturesPaused = false;

function pausePeriodicCaptures() {
  periodicCapturesPaused = true;
}

function unpausePeriodicCaptures() {
  periodicCapturesPaused = false;
}

let frameLastQueued = 0;
cameraEvents.on('frameQueued', () => { frameLastQueued = Date.now(); });
cameraEvents.on('frameQueued', () => console.log('frameQueued'));
let frameLastObtained = 0;
cameraEvents.on('frame', () => { frameLastObtained = Date.now(); });

function queueTakePhotoCallback(intervalMS) {
  return () => {
    const captureAlreadyQueued = frameLastQueued >= frameLastObtained;
    const frameLastObtainedTooRecent = (Date.now() - frameLastObtained) < intervalMS;
    if (
      periodicCapturesPaused
      || captureAlreadyQueued
      || frameLastObtainedTooRecent
    ) {
      return;
    }
    takePhoto();
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

  console.log(`changing frame updates to ${interval}ms`);
  if (frameUpdateIntervalHandle) {
    clearInterval(frameUpdateIntervalHandle);
    frameUpdateIntervalHandle = null;
  }

  frameUpdateIntervalHandle = setInterval(queueTakePhotoCallback(interval), interval);
  // don't keep node running just for this update (should be the listening on a port instead)
  frameUpdateIntervalHandle.unref();
  return takePhoto();
}

module.exports = {
  getLatestFrame,
  updateFramePeriodically,
  pausePeriodicCaptures,
  unpausePeriodicCaptures,
  captureFrame,
  setContrast,
  setSaturation,
  setBrightness,
  setCropWindow,
  // eventing
  addListener: (...args) => cameraEvents.addListener(...args),
  addOnceListener: (...args) => cameraEvents.once(...args),
  removeListener: (...args) => cameraEvents.removeListener(...args),
};
