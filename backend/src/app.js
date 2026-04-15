const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes   = require('./routes/auth');
const userRoutes   = require('./routes/users');
const lealtadRoutes = require('./routes/lealtad');
const adminRoutes  = require('./routes/admin');
const notificacionRoutes = require('./routes/notificaciones');

const app = express();

// ─── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ────────────────────────────────────────────────────────────────────
const fallbackOrigins = process.env.NODE_ENV === 'production'
  ? []
  : [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ];

const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOriginPatterns = [...new Set([...configuredOrigins, ...fallbackOrigins])]
  .map((originPattern) => originPattern.replace(/\/$/, ''));

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isOriginAllowed(origin) {
  const normalizedOrigin = (origin || '').replace(/\/$/, '');

  if (!normalizedOrigin) return true;

  if (allowedOriginPatterns.length === 0) {
    return process.env.NODE_ENV !== 'production';
  }

  return allowedOriginPatterns.some((pattern) => {
    if (!pattern.includes('*')) {
      return pattern === normalizedOrigin;
    }

    const wildcardRegex = new RegExp(`^${escapeRegex(pattern).replace(/\\\*/g, '.*')}$`);
    return wildcardRegex.test(normalizedOrigin);
  });
}

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }

    console.warn(`CORS blocked for origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.' },
});

app.use('/api/', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── Body Parsing & Compression ─────────────────────────────────────────────
app.use(compression({ threshold: 1024 }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lealtad', lealtadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notificaciones', notificacionRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// ─── Global error handler ─────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected server error occurred.'
    : err.message || 'An unexpected server error occurred.';

  if (statusCode >= 500) {
    console.error('Unhandled error:', err.message);
  }

  res.status(statusCode).json({ error: message });
});

module.exports = app;
module.exports.isOriginAllowed = isOriginAllowed;
