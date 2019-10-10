const SerialPort = require('serialport');

const port = new SerialPort('/dev/ttyACM0', { baudRate: 9600 });

var currentOperation = Promise.resolve();

async function advanceFrame() {
  await currentOperation();
  port.write('AF\n', (err)
}


port.on('error', console.error);
//port.on('data', (buffer) => console.log(`data: ${buffer}`));
port.pipe(process.stdout)

setTimeout(() => port.close(), 10e3);
//setTimeout(() => port.write('AF'), 6e3);
setTimeout(() => {
  port.write('AF\n', (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log('written');
    }
  });
}, 4e3);
