const { EventEmitter } = require('events');

const sharp = require('sharp');

const settings = require('./settings');
const isNumber = require('./utils/isNumber');
const Raspistill = require('./utils/Raspistill');

const raspistill = new Raspistill();

const cameraEvents = new EventEmitter();

let cameraCurrentOperation = Promise.resolve();

const MAX_WIDTH = 3280;
const MAX_HEIGHT = 2464;

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
  const usableWidth = usableLeft + dimensionedWidth > MAX_WIDTH ? (
    MAX_WIDTH - usableLeft
  ) : (
    dimensionedWidth
  );
  const usableHeight = usableTop + dimensionedHeight > MAX_HEIGHT ? (
    MAX_HEIGHT - usableTop
  ) : (
    dimensionedHeight
  );

  if (usableLeft >= MAX_WIDTH) {
    throw new Error('x must be in the image dimensions');
  }
  if (usableTop >= MAX_HEIGHT) {
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
  left: 0, top: 0, width: MAX_WIDTH, height: MAX_HEIGHT,
}, true);
settings.addListener('set:cropWindow', (window) => setCropWindow(window, true));

let latestFrame = null;

function getLatestFrame() {
  return { ...latestFrame };
}

function toBufferWithInfo(photo) {
  // sharp().toBuffer took about 900ms
  // TODO: can revert back when we do this on the first frame
  // then we can store the info, and freeze settings from changing until stop() is called
  return new Promise((res) => res({
    buffer: photo,
    info: {
      format: 'jpeg',
      width: MAX_WIDTH,
      height: MAX_HEIGHT,
    },
  }));
}

function takePhoto() {
  console.time('camera takePhoto stages');
  console.time('emit frameQueued');
  cameraEvents.emit('frameQueued');
  console.timeEnd('emit frameQueued');
  cameraCurrentOperation = cameraCurrentOperation
    .then(() => {
      console.time('raspistill takePhoto');
      return raspistill.takePhoto()
        .then((v) => {
          console.timeEnd('raspistill takePhoto');
          console.timeLog('camera takePhoto stages');
          return v;
        });
    })
    .then(toBufferWithInfo)
    .then(({ buffer, info: { format, width, height } }) => {
      console.timeEnd('camera takePhoto stages');
      latestFrame = {
        photo: buffer,
        encoding: format,
        size: {
          width,
          height,
        },
      };
      setTimeout(() => cameraEvents.emit('frame', latestFrame), 100);
      return latestFrame;
    });

  return cameraCurrentOperation;
}

function captureFrame() {
  console.time('captureFrame call of takePhoto');
  return takePhoto()
    .then(({ photo, encoding }) => {
      console.timeEnd('captureFrame call of takePhoto');
      console.time('extract & toBuffer');
      return {
        cropPromise: sharp(photo)
          .extract(cropWindow)
          .toBuffer()
          .then((croppedPhoto) => {
            console.timeEnd('extract & toBuffer');
            return {
              photo: croppedPhoto,
              encoding,
              size: cropWindow,
            };
          }),
      };
    });
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
  setCropWindow,
  // eventing
  addListener: (...args) => cameraEvents.addListener(...args),
  addOnceListener: (...args) => cameraEvents.once(...args),
  removeListener: (...args) => cameraEvents.removeListener(...args),
};
