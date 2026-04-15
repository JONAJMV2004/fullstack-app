require('dotenv').config();
const app = require('./src/app');
const { isOriginAllowed } = require('./src/app');
const { initSocket } = require('./src/config/socket');

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Attach Socket.IO to the HTTP server
initSocket(server, isOriginAllowed);
console.log('Socket.IO attached to server');

server.on('error', (err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
