const { EventEmitter } = require('events');
const fs = require('fs');
const { promisify } = require('util');
const path = require('path');

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

const fsp = {
  writeFile: promisify(fs.writeFile),
};

const camera = require('./camera');

const port = new SerialPort('/dev/ttyACM0', { baudRate: 9600 });
const portLines = port.pipe(new Readline({ delimiter: '\r\n' }));

const projectorEvents = new EventEmitter();

let currentOperation = Promise.resolve();

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
      res();
    };

    portLines.on('data', dataCallback);
  });
}

function stop() {
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

function saveFrame() {
  // we need the projector to hold still while we capture the frame
  // but the projector can move while we save to disk
  // so the current (projector) operation doesn't need to include the fs op
  // but we should return the fs op chain to avoid keeping too much data in memory
  // (too many photos build up due to fs being slower than the stepper motor)

  const getFrameChain = currentOperation
    .then(() => projectorEvents.emit('busy'))
    .then(() => camera.getLatestFrame());

  currentOperation = getFrameChain
    .then(() => projectorEvents.emit('idle'));

  return getFrameChain.then(({ photo, encoding }) => {
    // save photo to filesystem
    const filename = `frame-${Date.now()}.${encoding}`;
    const filePath = path.resolve(path.join('/home/pi/Photos', filename));
    return fsp.writeFile(filePath, photo, { encoding: 'binary' })
      .then(() => filePath);
  });
}

module.exports = {
  stop,
  advanceFrame,
  advance,
  saveFrame,
  // captureAndAdvance,
  // eventing
  addListener: (...args) => projectorEvents.addListener(...args),
  addOnceListener: (...args) => projectorEvents.once(...args),
  removeListener: (...args) => projectorEvents.removeListener(...args),
};
