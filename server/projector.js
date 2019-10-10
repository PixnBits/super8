const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline')

const port = new SerialPort('/dev/ttyACM0', { baudRate: 9600 });
const portLines = port.pipe(new Readline({ delimiter: '\r\n' }));

var currentOperation = Promise.resolve();


port.on('error', console.error);

function writeLineToPort(str) {
  return new Promise((res, rej) => {
    port.write(`${str}\n`, (err) => {
      if (err) {
        return rej(err);
      }
      res();
  });
}

// any of the lines, not all of the lines
// TODO: rename this function name to be less ambiguous
function waitForPortLines(...lines) {
  return new Promise((res) => {
    dataCallback = (lineString) => {
      if (!lines.includes(lineString)) {
        return;
      }
      portLines.removeListener('data', dataCallback);
      return res();
    }

    portLines.on('data', dataCallback);
  });
}

async function advanceFrame() {
  await currentOperation;
  
  currentOperation = Promise.resolve()
    .then(() => writeLineToPort('AF'))
    .then(() => waitForPortLines('MOTION_STOPPED', 'MOTORS_DISABLED'));

  return currentOperation;
}

module.exports = {
  advanceFrame,
};
