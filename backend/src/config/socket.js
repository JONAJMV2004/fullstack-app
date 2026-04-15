const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

let io = null;

// Map userId -> Set of socket IDs
const userSockets = new Map();

function initSocket(httpServer, isOriginAllowed) {
  io = new Server(httpServer, {
    cors: {
      origin(origin, cb) {
        cb(null, isOriginAllowed(origin));
      },
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  // Auth middleware — verify JWT on connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;

    // Track socket
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    // Join personal room
    socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) userSockets.delete(userId);
      }
    });
  });

  return io;
}

function getIO() {
  return io;
}

/**
 * Envía una notificación en tiempo real a un usuario específico.
 * @param {string} userId - UUID del usuario
 * @param {object} notificacion - objeto con { id, tipo, titulo, mensaje, created_at, leida }
 */
function emitToUser(userId, notificacion) {
  if (io) {
    io.to(`user:${userId}`).emit('notificacion:nueva', notificacion);
  }
}

/**
 * Envía a todos los usuarios conectados (broadcast).
 */
function emitToAll(notificacion) {
  if (io) {
    io.emit('notificacion:nueva', notificacion);
  }
}

module.exports = { initSocket, getIO, emitToUser, emitToAll, userSockets };
