// host includes the port, hostname does not
const ws = new WebSocket(`ws://${location.host}`);

// TODO: handle state updates
ws.addEventListener('message', function incoming(event) {
  console.log('message:', event.data);
});

function sendCommand(procedure, additionalData = {}) {
  ws.send(JSON.stringify({ ...additionalData, procedure }));
}

function stop() {
  sendCommand('stop');
}

function advanceFrame() {
  sendCommand('advanceFrame');
}

function advance() {
  sendCommand('advance');
}

module.exports = {
  stop,
  advanceFrame,
  advance,
};
