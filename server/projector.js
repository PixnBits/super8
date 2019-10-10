const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline')

const port = new SerialPort('/dev/ttyACM0', { baudRate: 9600 });
const portLines = port.pipe(new Readline());

var currentOperation = Promise.resolve();


port.on('error', console.error);
//port.on('data', (buffer) => console.log(`data: ${buffer}`));
port.pipe(process.stdout);

async function advanceFrame() {
  await currentOperation();

  currentOperation = new Promise((res, rej) => {
    port.write('AF\n', (err) => {
      if (err) {
        return rej(err);
      }

      // wait for MOTION_STOPPED or MOTORS_DISABLED
      dataCallback = (lineString) => {
        switch (lineString) {
          case 'ADVANCE_FRAME_STARTED':
            console.log('advanceFrame started');
            break;
          case 'MOTION_STOPPED':
          case 'MOTORS_DISABLED':
            portLines.removeListener('data', dataCallback);
            return res();
        }

      };

      portLines.on('data', dataCallback);
    })
  });

  return currentOperation;
}

export {
  advanceFrame
};
