const notifications = new EventTarget();

function dispatchNotification(name, otherData = {}) {
  const notificationEvent = new Event(name);
  notificationEvent.notification = otherData;
  notifications.dispatchEvent(notificationEvent);
}

let ws;
const MINIMUM_RETRY_DELAY = 2e3;
const MAXIMUM_RETRY_DELAY = 5 * 60 * 1e3;
function setupWebSocket(timeToWaitBetweenAttempts = MINIMUM_RETRY_DELAY) {
  // host includes the port, hostname does not
  ws = new WebSocket(`ws://${window.location.host}`);

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
      dispatchNotification(message.notification, message);
    }
  });

  let nextTimeToWaitBetweenAttempts = Math.floor(
    Math.min(
      MAXIMUM_RETRY_DELAY,
      Math.max(
        MINIMUM_RETRY_DELAY,
        1.2 * (0.9 + 0.2 * Math.random()) * timeToWaitBetweenAttempts
      )
    )
  );
  ws.addEventListener('open', () => {
    nextTimeToWaitBetweenAttempts = MINIMUM_RETRY_DELAY;
    dispatchNotification('commsOpen');
  });
  ws.addEventListener('close', () => {
    setTimeout(() => setupWebSocket(nextTimeToWaitBetweenAttempts), timeToWaitBetweenAttempts);
    dispatchNotification('commsClosed');
  });
}
setupWebSocket();

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
