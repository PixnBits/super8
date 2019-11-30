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
    case 'rewind':
    case 'captureAndAdvance':
    case 'lampOn':
    case 'lampOff':
      projector[message.procedure](...(message.args || []));
      return;

    case 'setAdvanceSpeed':
    case 'setLampBrightness':
      if (!Array.isArray(message.args)) {
        console.warn(`${message.procedure} requires arguments`);
      } else {
        projector[message.procedure](...message.args);
      }
      return;

    case 'setCropWindow':
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
  function sendNotificationToClient(clientWebSocket, notificationName, otherData = {}) {
    clientWebSocket.send(JSON.stringify({ ...otherData, notification: notificationName }));
  }

  function sendNotificationToEachClient(notificationName, otherData = {}) {
    console.log(`notification: ${notificationName}`, otherData);
    webSocketServer.clients.forEach((clientWebSocket) => {
      setTimeout(() => sendNotificationToClient(clientWebSocket, notificationName, otherData), 0);
    });
  }

  let busyOperationName = false; // false for idle
  projector.addListener('idle', () => {
    busyOperationName = false;
    sendNotificationToEachClient('idle');
  });
  projector.addListener('busy', (operationName) => {
    busyOperationName = operationName;
    sendNotificationToEachClient('busy');
  });

  let lampIsOn = false;
  projector.addListener('lampOn', () => {
    lampIsOn = true;
    sendNotificationToEachClient('lampOn');
  });
  projector.addListener('lampOff', () => {
    lampIsOn = false;
    sendNotificationToEachClient('lampOff');
  });
  let lampBrightness;
  projector.addListener('lampBrightness', (brightness) => {
    lampBrightness = brightness;
    sendNotificationToEachClient('lampBrightness', { brightness });
  });
  let advanceSpeed;
  projector.addListener('advanceSpeed', (speed) => {
    advanceSpeed = speed;
    sendNotificationToEachClient('advanceSpeed', { speed });
  });
  projector.addListener('captureStats', (stats) => sendNotificationToEachClient('captureStats', { stats }));
  projector.addListener('fileWritten', (filePath) => sendNotificationToEachClient('fileWritten', { filePath }));

  camera.addListener('frame', ({ encoding, size }) => sendNotificationToEachClient('frame', { frame: { encoding, size } }));

  let cameraCropWindow;
  camera.addListener('cropWindow', (cropWindow) => {
    cameraCropWindow = cropWindow;
    sendNotificationToEachClient('cameraCropWindow', { cropWindow });
  });

  webSocketServer.on('connection', (webSocket) => {
    console.log('new WebSocket connection');
    // TODO: ping-pong to avoid keeping closed connections
    // https://www.npmjs.com/package/ws#how-to-detect-and-close-broken-connections

    // client requests
    webSocket.on('message', handleClientMessage);

    // TODO: DRY up send current state on initial connections
    webSocket.send(JSON.stringify(
      busyOperationName ? { notification: 'busy', operationName: busyOperationName } : { notification: 'idle' }
    ));

    sendNotificationToClient(webSocket, lampIsOn ? 'lampOn' : 'lampOff');
    if (lampBrightness !== undefined) {
      webSocket.send(JSON.stringify({ notification: 'lampBrightness', brightness: lampBrightness }));
    }

    if (advanceSpeed !== undefined) {
      webSocket.send(JSON.stringify({ notification: 'advanceSpeed', speed: advanceSpeed }));
    }

    if (cameraCropWindow !== undefined) {
      webSocket.send(JSON.stringify({ notification: 'cameraCropWindow', cropWindow: cameraCropWindow }));
    }
  });
}

module.exports = setupComms;
