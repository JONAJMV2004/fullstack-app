const express = require('express');
const cors = require('cors');

const authRoutes   = require('./routes/auth');
const userRoutes   = require('./routes/users');
const lealtadRoutes = require('./routes/lealtad');
const adminRoutes  = require('./routes/admin');

const app = express();
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

// ─── Middleware ───────────────────────────────────────────────────────────────

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== 'production') {
  app.get('/api/test-db', async (req, res) => {
    const { supabaseAdmin } = require('./config/supabase');
    const { data, error } = await supabaseAdmin.from('usuarios').select('id, email').limit(5);
    if (error) return res.status(500).json({ connected: false, error });
    return res.json({ connected: true, rows: data });
  });

  app.post('/api/test-insert', async (req, res) => {
    const { supabaseAdmin } = require('./config/supabase');
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .insert([{ nombre: 'Test', email: `test_${Date.now()}@test.com`, password_hash: 'x', tipo_usuario: 'cliente', provider: 'local' }])
      .select('*')
      .single();
    if (error) return res.status(500).json({ ok: false, error });
    return res.json({ ok: true, data });
  });
}

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lealtad', lealtadRoutes);
app.use('/api/admin', adminRoutes);

// Legacy route aliases to keep compatibility with clients that call without /api.
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/lealtad', lealtadRoutes);
app.use('/admin', adminRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global error handler ─────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

module.exports = app;
