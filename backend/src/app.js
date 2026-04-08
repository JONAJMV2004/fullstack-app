const express = require('express');
const cors = require('cors');

const authRoutes   = require('./routes/auth');
const userRoutes   = require('./routes/users');
const lealtadRoutes = require('./routes/lealtad');
const adminRoutes  = require('./routes/admin');

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

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
