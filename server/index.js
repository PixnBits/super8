const path = require('path');

const fastify = require('fastify');
const fastifyStatic = require('fastify-static');
const fastifyWS = require('fastify-ws');
const WebSocket = require('ws');

const HTTP_PORT = process.env.HTTP_PORT || 3000;

const httpServer = fastify({ logger: false });

httpServer.ready((err) => {
  if (err) {
    console.error('server unable to listen', err);
    throw err;
  }

  console.log(`server listening on ${HTTP_PORT}`);
});

// static content
httpServer.register(fastifyStatic, { root: path.resolve(__dirname, '../public') });
httpServer.setNotFoundHandler((req, reply) => reply.redirect('/'));

// websockets for data communication
httpServer.register(fastifyWS);
httpServer.ready((err) => {
  if (err) {
    return;
  }

  httpServer.ws.on('connection', (webSocket) => {
    console.log('new WebSocket connection');
    webSocket.on('message', (message) => console.log('WebSocket message:', message));
    setTimeout(() => webSocket.send('from the server'));
  });
});

// start
httpServer.listen(HTTP_PORT, '127.0.0.1');

// const projector = require('./projector');
// setTimeout(async () => {
//   try {
//     await projector.advanceFrame();
//     console.log('1');
//     await projector.advanceFrame();
//     console.log('2');
//     await projector.advanceFrame();
//     console.log('3');
//   } catch (err) {
//     console.error(err);
//   } finally {
//     setTimeout(() => process.exit(), 3e3);
//   }
// }, 4e3);
