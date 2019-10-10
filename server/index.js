const projector = require('./projector');

setTimeout(() => process.exit(), 10e3);
//setTimeout(() => port.write('AF'), 6e3);
setTimeout(async () => {
  const idk = await projector.advanceFrame();
  console.log('idk', idk);
}, 4e3);
