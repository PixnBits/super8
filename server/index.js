const path = require('path');

const fastify = require('fastify');
const fastifyStatic = require('fastify-static');
const fastifyWS = require('fastify-ws');

const setupComms = require('./comms');
const camera = require('./camera');

const HTTP_PORT = process.env.HTTP_PORT || 3000;

const httpServer = fastify({ logger: false });

httpServer.ready((err) => {
  if (err) {
    console.error('server unable to listen', err);
    throw err;
  }

  console.log(`server listening on ${HTTP_PORT}`);
});

// camera images
// TODO: handle different encodings
httpServer.get('/frame.jpg', (request, reply) => {
  reply
    .type('image/jpeg')
    .send(camera.getLatestFrame().photo);
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

  setupComms(httpServer.ws);
});

// start
camera.updateFramePeriodically(3e3);
httpServer.listen(HTTP_PORT, '0.0.0.0');
