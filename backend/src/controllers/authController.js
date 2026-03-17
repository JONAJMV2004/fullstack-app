const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const UsuarioModel = require('../models/usuarioModel');

const SALT_ROUNDS = 12;
const TOKEN_EXPIRES_IN = '7d';

function signToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );
}

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { nombre, name, email, password } = req.body;
    const nombreFinal = nombre || name;

    if (!nombreFinal || !email || !password)
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos.' });

    if (password.length < 6)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });

    const existing = await UsuarioModel.findByEmail(email);
    if (existing)
      return res.status(409).json({ error: 'Ya existe una cuenta con este email.' });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const usuario = await UsuarioModel.create({ nombre: nombreFinal, email, passwordHash });
    const token = signToken(usuario);

    return res.status(201).json({
      message: 'Registro exitoso.',
      token,
      user: { id: usuario.id, nombre: usuario.nombre, name: usuario.nombre, email: usuario.email, tipo_usuario: usuario.tipo_usuario },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Error del servidor al registrar.' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email y contraseña son requeridos.' });

    const usuario = await UsuarioModel.findByEmail(email);
    if (!usuario || !usuario.password_hash)
      return res.status(401).json({ error: 'Email o contraseña incorrectos.' });

    const isValid = await bcrypt.compare(password, usuario.password_hash);
    if (!isValid)
      return res.status(401).json({ error: 'Email o contraseña incorrectos.' });

    const token = signToken(usuario);

    return res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      token,
      user: { id: usuario.id, nombre: usuario.nombre, name: usuario.nombre, email: usuario.email, tipo_usuario: usuario.tipo_usuario },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Error del servidor al iniciar sesión.' });
  }
};

// GET /api/auth/oauth/google
exports.googleOAuthUrl = async (req, res) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: process.env.OAUTH_REDIRECT_URL },
    });
    if (error) throw error;
    return res.status(200).json({ url: data.url });
  } catch (err) {
    console.error('Google OAuth error:', err);
    return res.status(500).json({ error: 'Error al iniciar login con Google.' });
  }
};

// GET /api/auth/oauth/facebook
exports.facebookOAuthUrl = async (req, res) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: process.env.OAUTH_REDIRECT_URL },
    });
    if (error) throw error;
    return res.status(200).json({ url: data.url });
  } catch (err) {
    console.error('Facebook OAuth error:', err);
    return res.status(500).json({ error: 'Error al iniciar login con Facebook.' });
  }
};

// POST /api/auth/oauth/callback
exports.oauthCallback = async (req, res) => {
  try {
    const { access_token, refresh_token } = req.body;

    if (!access_token)
      return res.status(400).json({ error: 'access_token es requerido.' });

    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (sessionError || !sessionData.user)
      return res.status(401).json({ error: 'Sesión OAuth inválida o expirada.' });

    const supaUser = sessionData.user;
    const provider = supaUser.app_metadata?.provider || 'oauth';
    const nombre =
      supaUser.user_metadata?.full_name ||
      supaUser.user_metadata?.name ||
      supaUser.email.split('@')[0];
    const avatarUrl = supaUser.user_metadata?.avatar_url || null;

    const usuario = await UsuarioModel.upsertOAuth({
      nombre,
      email: supaUser.email,
      provider,
      avatarUrl,
      supabaseAuthId: supaUser.id,
    });

    const token = signToken(usuario);

    return res.status(200).json({
      message: 'Login OAuth exitoso.',
      token,
      user: { id: usuario.id, nombre: usuario.nombre, name: usuario.nombre, email: usuario.email, tipo_usuario: usuario.tipo_usuario, avatar_url: usuario.avatar_url },
    });
  } catch (err) {
    console.error('OAuth callback error:', err);
    return res.status(500).json({ error: 'Error del servidor en OAuth callback.' });
  }
};

// GET /api/auth/me  (protegida)
exports.getMe = async (req, res) => {
  try {
    const usuario = await UsuarioModel.findById(req.user.id);
    if (!usuario)
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    return res.status(200).json({ user: { ...usuario, name: usuario.nombre } });
  } catch (err) {
    console.error('GetMe error:', err);
    return res.status(500).json({ error: 'Error del servidor.' });
  }
};
