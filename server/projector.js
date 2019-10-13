const { EventEmitter } = require('events');

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

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

module.exports = {
  stop,
  advanceFrame,
  advance,
  // eventing
  addListener: (...args) => projectorEvents.addListener(...args),
  addOnceListener: (...args) => projectorEvents.once(...args),
  removeListener: (...args) => projectorEvents.removeListener(...args),
};
