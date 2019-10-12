const projector = require('./projector');

function handleClientMessage(rawMessage) {
  console.log('WebSocket message:', rawMessage);
  let message;
  try {
    message = JSON.parse(rawMessage);
  } catch (err) {
    console.error('unable to parse incoming client message', rawMessage, err);
    return;
  }
  switch (message.procedure) {
    case 'stop':
      projector.stop();
      return;
    case 'advanceFrame':
      projector.advanceFrame();
      return;
    case 'advance':
      projector.advance();
      return;
    default:
      console.warn(`unknown procedure "${message.procedure}"`, message);
  }
}

function setupComms(webSocketServer) {
  webSocketServer.on('connection', (webSocket) => {
    console.log('new WebSocket connection');
    webSocket.on('message', handleClientMessage);
    setTimeout(() => webSocket.send('from the server'));
  });
}

module.exports = setupComms;
