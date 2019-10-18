const { EventEmitter } = require('events');
const fs = require('fs');
const { promisify } = require('util');
const path = require('path');

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

const isNumber = require('./utils/isNumber');

const fsp = {
  writeFile: promisify(fs.writeFile),
};

const camera = require('./camera');

const port = new SerialPort('/dev/ttyACM0', { baudRate: 9600 });
const portLines = port.pipe(new Readline({ delimiter: '\r\n' }));

const projectorEvents = new EventEmitter();

let currentOperation = Promise.resolve();
let needToStopCaptureAndAdvance = false;

port.on('error', console.error);

function writeLineToPort(str) {
  return new Promise((res, rej) => {
    port.write(`${str}\n`, (err) => {
      if (err) {
        return rej(err);
      }
      return res();
    });
  });
}

// any of the lines, not all of the lines
// TODO: rename this function name to be less ambiguous
function waitForPortLines(...lines) {
  return new Promise((res) => {
    const dataCallback = (lineString) => {
      if (!lines.includes(lineString)) {
        return;
      }
      portLines.removeListener('data', dataCallback);
      res(lineString);
    };

    portLines.on('data', dataCallback);
  });
}

function stop() {
  needToStopCaptureAndAdvance = true;
  camera.unpausePeriodicCaptures();

  currentOperation = currentOperation
    .then(() => writeLineToPort('S'))
    .then(() => waitForPortLines('MOTORS_DISABLED'))
    .then(() => projectorEvents.emit('idle'));

  return currentOperation;
}

function advanceFrame() {
  currentOperation = currentOperation
    .then(() => projectorEvents.emit('busy'))
    .then(() => writeLineToPort('AF'))
    .then(() => waitForPortLines('MOTION_STOPPED', 'MOTORS_DISABLED'))
    .then(() => projectorEvents.emit('idle'));

  return currentOperation;
}

function advance() {
  currentOperation = currentOperation
    .then(() => projectorEvents.emit('busy'))
    .then(() => writeLineToPort('A'));

  return currentOperation;
}


function setAdvanceSpeed(speed) {
  if (!isNumber(speed)) {
    return Promise.reject(new Error('speed must be a number'));
  }
  if (speed < 0) {
    return Promise.reject(new Error('speed cannot be negative'));
  }

  currentOperation = currentOperation
    .then(() => writeLineToPort(`A S ${speed}`))
    .then(() => projectorEvents.emit('advanceSpeed', speed));

  return currentOperation;
}

// skipBusyIdleNotifications means the calling function whill handle those manually
function captureFrame(frameIdentifier, skipBusyIdleNotifications = false) {
  // we need the projector to hold still while we capture the frame
  // but the projector can move while we save to disk
  // so the current (projector) operation doesn't need to include the fs op
  // but we should return the fs op chain to avoid keeping too much data in memory
  // (too many photos build up due to fs being slower than the stepper motor)

  const getFrameChain = currentOperation
    .then(() => {
      if (!skipBusyIdleNotifications) {
        projectorEvents.emit('busy');
      }
    })
    .then(() => camera.captureFrame());

  currentOperation = getFrameChain
    .then(() => {
      if (!skipBusyIdleNotifications) {
        projectorEvents.emit('idle');
      }
    });

  return getFrameChain.then(({ photo, encoding }) => {
    // save photo to filesystem
    const filename = `frame-${frameIdentifier || Date.now()}.${encoding}`;
    const filePath = path.resolve(path.join('/home/pi/Pictures', filename));
    return fsp.writeFile(filePath, photo, { encoding: 'binary' })
      .then(() => filePath);
  });
}

function captureAndAdvance(frameNumber = 0) {
  // avoid emitting every capture, advance
  if (frameNumber === 0) {
    projectorEvents.emit('busy');
    needToStopCaptureAndAdvance = false;
    camera.pausePeriodicCaptures();
  }

  // To pad or not to pad.... might be helpful for certain tools and even just
  // viewing the images in order, but we'd need to know the total frame count
  captureFrame(`${frameNumber}`, true)
  // captureFrame(`${frameNumber}`.padStart(8, '0'), true)
    .then(() => advanceFrame())
    .then(() => {
      if (needToStopCaptureAndAdvance) {
        return null;
      }
      return captureAndAdvance(frameNumber + 1);
    });
}

function lampOn() {
  currentOperation = currentOperation
    .then(() => writeLineToPort('L A'))
    .then(() => waitForPortLines('LAMP_ON'))
    .then(() => projectorEvents.emit('lampOn'));

  return currentOperation;
}

function lampOff() {
  currentOperation = currentOperation
    .then(() => writeLineToPort('L D'))
    .then(() => waitForPortLines('LAMP_OFF'))
    .then(() => projectorEvents.emit('lampOff'));

  return currentOperation;
}

function setLampBrightness(brightness) {
  if (!isNumber(brightness)) {
    return Promise.reject(new Error('brightness must be a number'));
  }
  if (brightness % 1) {
    return Promise.reject(new Error('brightness must be an integer'));
  }
  if (brightness > 255 || brightness < 0) {
    return Promise.reject(new Error('brightness must be between 0 and 255'));
  }

  currentOperation = currentOperation
    .then(() => writeLineToPort(`L S ${brightness}`))
    .then(() => waitForPortLines('LAMP_ON', 'LAMP_OFF'))
    .then((line) => {
      projectorEvents.emit('lampBrightness', brightness);
      projectorEvents.emit(line === 'LAMP_OFF' ? 'lampOff' : 'lampOn');
    });

  return currentOperation;
}

module.exports = {
  stop,
  advanceFrame,
  advance,
  setAdvanceSpeed,
  captureFrame,
  captureAndAdvance,
  lampOn,
  lampOff,
  setLampBrightness,
  // eventing
  addListener: (...args) => projectorEvents.addListener(...args),
  addOnceListener: (...args) => projectorEvents.once(...args),
  removeListener: (...args) => projectorEvents.removeListener(...args),
};
