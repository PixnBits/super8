// host includes the port, hostname does not
const ws = new WebSocket(`ws://${location.host}`);

ws.addEventListener('open', function open() {
  ws.send('from the client');
});

ws.addEventListener('message', function incoming(event) {
  console.log('message', event.data);
});
