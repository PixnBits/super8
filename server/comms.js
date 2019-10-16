const projector = require('./projector');
const camera = require('./camera');

// lots of procedure names
/* eslint-disable-next-line complexity */
function handleClientMessage(rawMessage) {
  console.log('WebSocket message:', rawMessage);
  let message;
  try {
    message = JSON.parse(rawMessage);
  } catch (err) {
    console.warn('unable to parse incoming client message', rawMessage, err);
    return;
  }
  switch (message.procedure) {
    case 'stop':
    case 'advanceFrame':
    case 'captureFrame':
    case 'advance':
    case 'captureAndAdvance':
    case 'lampOn':
    case 'lampOff':
      projector[message.procedure]();
      return;

    case 'setLampBrightness':
      if (!Array.isArray(message.args)) {
        console.warn(`${message.procedure} requires arguments`);
      } else {
        projector[message.procedure](...message.args);
      }
      return;

    case 'setCameraBrightness':
      if (!Array.isArray(message.args)) {
        console.warn(`${message.procedure} requires arguments`);
      } else {
        camera.setBrightness(...message.args);
      }
      return;

    case 'setContrast':
    case 'setSaturation':
      if (!Array.isArray(message.args)) {
        console.warn(`${message.procedure} requires arguments`);
      } else {
        camera[message.procedure](...message.args);
      }
      return;

    default:
      console.warn(`unknown procedure "${message.procedure}"`, message);
  }
}

function setupComms(webSocketServer) {
  let busyOperationName = false; // false for idle
  let cameraSettings = null;

  function sendNotificationToEachClient(notificationName, otherData = {}) {
    webSocketServer.clients.forEach((clientWebSocket) => {
      clientWebSocket.send(JSON.stringify({ ...otherData, notification: notificationName }));
    });
  }

  projector.addListener('idle', () => {
    busyOperationName = false;
    sendNotificationToEachClient('idle');
  });

  projector.addListener('busy', (operationName) => {
    busyOperationName = operationName;
    sendNotificationToEachClient('busy');
  });

  projector.addListener('lampOn', () => sendNotificationToEachClient('lampOn'));
  projector.addListener('lampOff', () => sendNotificationToEachClient('lampOff'));
  projector.addListener('lampBrightness', (brightness) => sendNotificationToEachClient('lampBrightness', { brightness }));

  camera.addListener('frame', () => sendNotificationToEachClient('frame'));

  camera.addListener('settings', (settings) => {
    cameraSettings = settings;
    sendNotificationToEachClient('cameraSettings', { settings });
  });

  webSocketServer.on('connection', (webSocket) => {
    console.log('new WebSocket connection');
    // TODO: ping-pong to avoid keeping closed connections
    // https://www.npmjs.com/package/ws#how-to-detect-and-close-broken-connections

    // client requests
    webSocket.on('message', handleClientMessage);

    // send current state
    // TODO: DRY up idle/busy notifications
    webSocket.send(JSON.stringify(
      busyOperationName ? { notification: 'busy', operationName: busyOperationName } : { notification: 'idle' }
    ));
    webSocket.send(JSON.stringify({ notification: 'cameraSettings', settings: cameraSettings }));
  });
}

module.exports = setupComms;
