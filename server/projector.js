const { EventEmitter } = require('events');
const fs = require('fs');
const { promisify } = require('util');
const path = require('path');

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

const isNumber = require('./utils/isNumber');

const fsp = {
  mkdir: promisify(fs.mkdir),
  writeFile: promisify(fs.writeFile),
};

const camera = require('./camera');

const ROOT_SAVE_FOLDER = '/home/pi/Pictures';

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

function emitBusy(skipBusyIdleNotifications = false) {
  if (skipBusyIdleNotifications) {
    return;
  }
  projectorEvents.emit('busy');
}

function emitIdle(skipBusyIdleNotifications = false) {
  if (skipBusyIdleNotifications) {
    return;
  }
  projectorEvents.emit('idle');
}

function stop() {
  needToStopCaptureAndAdvance = true;
  camera.unpausePeriodicCaptures();

  currentOperation = currentOperation
    .then(() => writeLineToPort('S'))
    .then(() => waitForPortLines('MOTORS_DISABLED'))
    .then(() => emitIdle());

  return currentOperation;
}

function advanceFrame(skipBusyIdleNotifications) {
  currentOperation = currentOperation
    .then(() => emitBusy(skipBusyIdleNotifications))
    .then(() => writeLineToPort('AF'))
    .then(() => waitForPortLines('MOTION_STOPPED', 'MOTORS_DISABLED'))
    .then(() => emitIdle(skipBusyIdleNotifications));

  return currentOperation;
}

function advance() {
  currentOperation = currentOperation
    .then(() => emitBusy())
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
function captureFrame(frameIdentifier, folderName = '', skipBusyIdleNotifications = false) {
  // we need the projector to hold still while we capture the frame
  // but the projector can move while we save to disk
  // so the current (projector) operation doesn't need to include the fs op
  // but we should return the fs op chain to avoid keeping too much data in memory
  // (too many photos build up due to fs being slower than the stepper motor)

  const getFrameChain = currentOperation
    .then(() => emitBusy(skipBusyIdleNotifications))
    .then(() => camera.captureFrame());

  currentOperation = getFrameChain
    .then(() => emitIdle(skipBusyIdleNotifications));

  return getFrameChain.then(({ photo, encoding, size }) => {
    // save photo to filesystem
    const filename = `frame-${frameIdentifier || Date.now()}.${encoding}`;
    const filePath = path.resolve(path.join(ROOT_SAVE_FOLDER, folderName, filename));
    if (!filePath.startsWith(ROOT_SAVE_FOLDER)) {
      return Promise.reject(new Error('possibly dangerous folder name'));
    }
    return fsp.mkdir(path.dirname(filePath))
      .catch((err) => {
        if (err.code === 'EEXIST') {
          // actually a success
          return;
        }
        throw err;
      })
      .then(() => fsp.writeFile(filePath, photo, { encoding: 'binary' }))
      .then(() => {
        console.log(`wrote ${filePath}`, size);
        projectorEvents.emit('fileWritten', filePath);
        return filePath;
      });
  });
}

function captureAndAdvance(
  folderName = `capture-group-${Date.now()}`,
  frameNumber = 0,
  stats = { frameCount: 0, started: Date.now() }
) {
  // avoid emitting every capture, advance
  if (stats.frameCount === 0) {
    emitBusy();
    needToStopCaptureAndAdvance = false;
    camera.pausePeriodicCaptures();
  }

  captureFrame(`${frameNumber}`, folderName, true)
    .then(() => advanceFrame(true))
    .then(() => {
      const presentStats = { ...stats };
      presentStats.frameCount += 1;
      const now = Date.now();
      projectorEvents.emit('captureStats', { ...presentStats, now });
      const secondsElapsed = Math.round((now - presentStats.started) / 1e3);
      console.log(`${presentStats.frameCount} in ${secondsElapsed}s, or ${presentStats.frameCount / secondsElapsed} fps (${secondsElapsed / presentStats.frameCount} spf)`);
      if (needToStopCaptureAndAdvance) {
        presentStats.finished = now;
        return presentStats;
      }
      return captureAndAdvance(folderName, frameNumber + 1, presentStats);
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
