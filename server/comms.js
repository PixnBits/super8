const projector = require('./projector');
const camera = require('./camera');

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
      projector.stop();
      return;
    case 'advanceFrame':
      projector.advanceFrame();
      return;
    case 'captureFrame':
      projector.captureFrame();
      return;
    case 'advance':
      projector.advance();
      return;
    case 'captureAndAdvance':
      projector.captureAndAdvance();
      return;
    default:
      console.warn(`unknown procedure "${message.procedure}"`, message);
  }
}

function setupComms(webSocketServer) {
  let busyOperationName = false; // false for idle

  projector.addListener('idle', () => {
    webSocketServer.clients.forEach((clientWebSocket) => {
      clientWebSocket.send(JSON.stringify({ notification: 'idle' }));
    });
    busyOperationName = false;
  });

  projector.addListener('busy', (operationName) => {
    webSocketServer.clients.forEach((clientWebSocket) => {
      clientWebSocket.send(JSON.stringify({ notification: 'busy', operationName }));
    });
    busyOperationName = operationName;
  });

  camera.addListener('frame', () => {
    webSocketServer.clients.forEach((clientWebSocket) => {
      clientWebSocket.send(JSON.stringify({ notification: 'frame' }));
    });
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
  });
}

module.exports = setupComms;
