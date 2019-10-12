// host includes the port, hostname does not
const ws = new WebSocket(`ws://${location.host}`);

const notifications = new EventTarget();

// TODO: handle state updates
ws.addEventListener('message', function incoming(event) {
  console.log('message:', event.data);

  var message;
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

// args should be an object for key/value pairs
function sendCommand(procedure, args) {
  // TODO: ensure procedure is a truthy string? (args is optional)
  ws.send(JSON.stringify({ procedure, args }));
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
  // eventing
  addEventListener: (...args) => notifications.addEventListener(...args),
  removeEventListener: (...args) => notifications.removeEventListener(...args),
};
