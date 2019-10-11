const projector = require('./projector');

setTimeout(async () => {
  try {
    await projector.advanceFrame();
    console.log('1');
    await projector.advanceFrame();
    console.log('2');
    await projector.advanceFrame();
    console.log('3');
  } catch (err) {
    console.error(err);
  } finally {
    setTimeout(() => process.exit(), 3e3);
  }
}, 4e3);
