const http = require('http');
const path = require('path');

const static = require('node-static');
const WebSocket = require('ws');

const HTTP_PORT = process.env.HTTP_PORT || 3000;
const publicServer = new static.Server(path.resolve(__dirname, '../public'), { cache: 0 });

const httpServer = http.createServer((req, res) => {
  req
    .addListener('end', () => console.log(`request ${req.method} ${req.url}`))
    .addListener('end', () => publicServer.serve(req, res, (err, result) => {
      if (!err) {
        return;
      }

      // redirect when the file didn't exist
      if (err.status === 404) {
        console.log(`redirecting ${req.url} to /`);
        res.writeHead(302, { 'Location': '/' });
        res.end();
        return;
      }

      console.error(`error serving ${req.url}`, err);
      res.writeHead(err.status, err.headers);
      res.end();
    }))
    .resume();
});

const webSocketServer = new WebSocket.Server({ server: httpServer });

webSocketServer.on('connection', (webSocket) => {
  console.log('new WebSocket connection');
  webSocket.on('message', (message) => console.log('WebSocket message', message));
  setTimeout(() => webSocket.send('from the server'));
});

httpServer.listen(HTTP_PORT, '127.0.0.1', (err) => {
  if (err) {
    console.error('server unable to listen', err);
  } else {
    console.log(`server listening on ${HTTP_PORT}`);
  }
})

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
