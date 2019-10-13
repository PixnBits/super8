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
    case 'saveFrame':
      projector.saveFrame();
      return;
    case 'advance':
      projector.advance();
      return;
    // case 'captureAndAdvance':
    //   projector.captureAndAdvance();
    //   return;
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

  webSocketServer.on('connection', (webSocket) => {
    console.log('new WebSocket connection');
    // TODO: ping-pong to avoid keeping closed connections
    // https://www.npmjs.com/package/ws#how-to-detect-and-close-broken-connections

    webSocket.on('message', handleClientMessage);
    const sendFrameNotification = () => webSocket.send(JSON.stringify({ notification: 'frame' }));
    webSocket.on('close', () => camera.removeListener('frame', sendFrameNotification));
    camera.addListener('frame', sendFrameNotification);
    // TODO: DRY up idle/busy notifications
    webSocket.send(JSON.stringify(
      busyOperationName ? { notification: 'busy', operationName: busyOperationName } : { notification: 'idle' }
    ));
  });
}

module.exports = setupComms;
