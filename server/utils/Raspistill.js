const { spawn } = require('child_process');

const JPEG_END_OF_FILE = Buffer.from([0xFF, 0xD9]);

function Raspistill(cameraOptions) {
  if (!(this instanceof Raspistill)) {
    return new Raspistill(cameraOptions);
  }

  this.currentOperation = Promise.resolve();
  this.setupExecutor(cameraOptions);
}

Raspistill.prototype.setupExecutor = function setupExecutor(/* TODO: cameraOptions */) {
  if (this.executor) {
    this.currentOperation = this.currentOperation
      .then(() => new Promise((res) => {
        this.executor.on('exit', (res));
        this.executor.kill();
      }));
  }

  this.currentOperation = this.currentOperation
    .then(() => {
      const args = [
        '-t', '0',
        '-s',
        '--nopreview',
        // tried '--burst' but the brightness doesn't adapt so everything after setup is too dark
        '-w', '3280', '-h', '2464', // default dimensions, but let's be explicit
        '-e', 'jpg',
        '-q', '100',
        '-o', '-', // send the image to STDOUT
      ];
      // FIXME: use cameraOptions to add other options (contrast, brightness, saturation)
      const executor = spawn('raspistill', args);
      this.executor = executor;
      console.log('new executor', `pid: ${executor.pid}`);
      executor.on('error', (error) => console.error('raspistill error', error));
      executor.on('exit', (code, signal) => {
        delete this.executor;
        console.warn('raspistill exited', code, signal);
      });
      // need to wait a few seconds while it boots up before it is ready for signals
      return new Promise((res) => setTimeout(res, 5e3));
    });

  return this.currentOperation;
};

Raspistill.prototype.setOptions = function setOptions(cameraOptions) {
  return this.setupExecutor(cameraOptions);
};

Raspistill.prototype.takePhoto = function takePhoto() {
  const { executor } = this;

  this.currentOperation = this.currentOperation
    .then(() => new Promise((res, rej) => {
      console.log('our turn to take a photo');
      let stdoutBuffer = Buffer.alloc(0);

      function removeHandlers() {
        // the handlers reference this function, best to define this function first
        /* eslint-disable no-use-before-define */
        executor.stdout.off('data', stdoutDataHandler);
        executor.stderr.off('data', stderrDataHandler);
        executor.off('exit', exitHandler);
        /* eslint-enable no-use-before-define */
      }

      function stdoutDataHandler(buffer) {
        // faster to provide the new length when explicitly known
        stdoutBuffer = Buffer.concat([stdoutBuffer, buffer], stdoutBuffer.length + buffer.length);
        const lastBytesCheck = stdoutBuffer.subarray(stdoutBuffer.length - 2);
        if (!JPEG_END_OF_FILE.equals(lastBytesCheck)) {
          return;
        }

        // end of the JPEG
        removeHandlers();
        console.timeEnd('raspistill photo');
        res(stdoutBuffer);
      }

      function stderrDataHandler(buffer) {
        removeHandlers();
        console.error('got STDERR bytes', buffer, buffer.toString('utf8'));
        rej(buffer.toString('utf8'));
      }

      function exitHandler(code) {
        console.log('photo but process exit');
        rej(code);
      }

      executor.stdout.on('data', stdoutDataHandler);
      executor.stderr.on('data', stderrDataHandler);
      executor.on('exit', exitHandler);

      console.log('sending SIGUSR1');
      console.time('raspistill photo');
      executor.kill('SIGUSR1');
    }));

  return this.currentOperation;
};

module.exports = Raspistill;
