// host includes the port, hostname does not
const ws = new WebSocket(`ws://${window.location.host}`);

const notifications = new EventTarget();

// TODO: handle state updates
ws.addEventListener('message', (event) => {
  console.log('message:', event.data);

  let message;
  try {
    message = JSON.parse(event.data);
  } catch (err) {
    console.warn('unable to parse incoming server message', event.data, err);
    return;
  }

  if ('notification' in message) {
    const notificationEvent = new Event(message.notification);
    notificationEvent.notification = message;
    notifications.dispatchEvent(notificationEvent);
  }
});

// args can be an object for key/value pairs
// args can be an array for positional values
function sendCommand(procedure, args) {
  // TODO: ensure procedure is a truthy string? (args is optional)
  ws.send(JSON.stringify({ procedure, args }));
}

function captureAndAdvance() {
  sendCommand('captureAndAdvance');
}

function stop() {
  sendCommand('stop');
}

function advanceFrame() {
  sendCommand('advanceFrame');
}

function captureFrame() {
  sendCommand('captureFrame');
}

function advance() {
  sendCommand('advance');
}

function setLampBrightness(brightness) {
  sendCommand('setLampBrightness', [brightness]);
}

function setAdvanceSpeed(speed) {
  sendCommand('setAdvanceSpeed', [speed]);
}

function setContrast(contrast) {
  sendCommand('setContrast', [contrast]);
}

function setSaturation(saturation) {
  sendCommand('setSaturation', [saturation]);
}

function setCameraBrightness(brightness) {
  sendCommand('setCameraBrightness', [brightness]);
}

module.exports = {
  // projector
  captureAndAdvance,
  stop,
  advanceFrame,
  captureFrame,
  advance,
  setLampBrightness,
  setAdvanceSpeed,
  // camera
  setContrast,
  setSaturation,
  setCameraBrightness,
  // eventing
  addEventListener: (...args) => notifications.addEventListener(...args),
  removeEventListener: (...args) => notifications.removeEventListener(...args),
};
