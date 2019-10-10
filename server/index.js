const projector = require('./projector');

setTimeout(async () => {
  try {
    await projector.advanceFrame();
  } catch (err) {
    console.error(err);
  } finally {
    setTimeout(() => process.exit(), 3e3);
  }
}, 4e3);
