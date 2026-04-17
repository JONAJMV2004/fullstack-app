const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const UsuarioModel = require('../models/usuarioModel');
const PuntosModel = require('../models/puntosModel');
const { JWT_SECRET } = require('../middleware/auth');

const SALT_ROUNDS = 12;
const TOKEN_EXPIRES_IN = '7d';
const MIN_PASSWORD_LENGTH = 8;
const FACEBOOK_GRAPH_API_BASE = 'https://graph.facebook.com';

function normalizeOrigin(value) {
  return String(value || '').trim().replace(/\/$/, '');
}

function isLocalDevOrigin(url) {
  return ['localhost', '127.0.0.1'].includes(url.hostname);
}

function getSafeRedirectTo(req) {
  const fallback = String(process.env.OAUTH_REDIRECT_URL || '').trim();
  const requested = String(req.query.redirectTo || '').trim();

  if (!requested) return fallback;

  try {
    const requestedUrl = new URL(requested);
    const configuredOrigins = String(process.env.FRONTEND_URL || '')
      .split(',')
      .map(normalizeOrigin)
      .filter(Boolean);

    const requestedOrigin = normalizeOrigin(requestedUrl.origin);
    const isAllowedConfiguredOrigin = configuredOrigins.includes(requestedOrigin);

    if (isAllowedConfiguredOrigin) return requested;

    const isDev = process.env.NODE_ENV !== 'production';
    const isAllowedDevOrigin = isDev && isLocalDevOrigin(requestedUrl);
    if (isAllowedDevOrigin) return requested;

    return fallback;
  } catch {
    return fallback;
  }
}

function signToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, tipo_usuario: usuario.tipo_usuario },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );
}

function sanitizeUser(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    name: usuario.nombre,
    email: usuario.email,
    telefono: usuario.telefono,
    tipo_usuario: usuario.tipo_usuario,
    avatar_url: usuario.avatar_url,
  };
}

async function fetchFacebookDebugToken({ userAccessToken, appId, appSecret }) {
  const appAccessToken = `${appId}|${appSecret}`;
  const params = new URLSearchParams({
    input_token: userAccessToken,
    access_token: appAccessToken,
  });

  const response = await fetch(`${FACEBOOK_GRAPH_API_BASE}/debug_token?${params.toString()}`);
  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`Facebook debug_token failed (${response.status}): ${raw}`);
  }

  const payload = await response.json();
  return payload?.data || null;
}

async function fetchFacebookProfile(userAccessToken) {
  const params = new URLSearchParams({
    fields: 'id,name,email,picture.type(large)',
    access_token: userAccessToken,
  });

  const response = await fetch(`${FACEBOOK_GRAPH_API_BASE}/me?${params.toString()}`);
  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`Facebook me endpoint failed (${response.status}): ${raw}`);
  }

  return response.json();
}

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { nombre, name, email, password, telefono } = req.body;
    const nombreFinal = String(nombre || name || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPhone = String(telefono || '').trim();

    if (!nombreFinal || !normalizedEmail || !password || !normalizedPhone)
      return res.status(400).json({ error: 'Nombre, email, celular y contraseña son requeridos.' });

    if (nombreFinal.length > 100)
      return res.status(400).json({ error: 'El nombre es demasiado largo.' });

    if (password.length < MIN_PASSWORD_LENGTH)
      return res.status(400).json({ error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` });

    if (normalizedPhone.length < 8 || normalizedPhone.length > 20)
      return res.status(400).json({ error: 'El celular debe tener entre 8 y 20 caracteres.' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail))
      return res.status(400).json({ error: 'Email inválido.' });

    const existing = await UsuarioModel.findByEmail(normalizedEmail);
    if (existing)
      return res.status(409).json({ error: 'Ya existe una cuenta con este email.' });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const usuario = await UsuarioModel.create({
      nombre: nombreFinal,
      email: normalizedEmail,
      telefono: normalizedPhone,
      passwordHash,
    });

    // Regalo de bienvenida: 1 punto por registro
    await PuntosModel.addEntry({
      usuarioId: usuario.id,
      descripcion: 'Bienvenida al programa de lealtad',
      puntos: 1,
    }).catch(e => console.error('Error asignando punto de bienvenida:', e.message));

    const token = signToken(usuario);

    return res.status(201).json({
      message: 'Registro exitoso.',
      token,
      user: sanitizeUser(usuario),
    });
  } catch (err) {
    console.error('Register error:', err.message);
    return res.status(500).json({ error: 'Error del servidor al registrar.' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password)
      return res.status(400).json({ error: 'Email y contraseña son requeridos.' });

    const usuario = await UsuarioModel.findByEmail(normalizedEmail);
    if (!usuario || !usuario.password_hash)
      return res.status(401).json({ error: 'Email o contraseña incorrectos.' });

    const isValid = await bcrypt.compare(password, usuario.password_hash);
    if (!isValid)
      return res.status(401).json({ error: 'Email o contraseña incorrectos.' });

    const token = signToken(usuario);

    return res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      token,
      user: sanitizeUser(usuario),
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Error del servidor al iniciar sesión.' });
  }
};

// GET /api/auth/oauth/google
exports.googleOAuthUrl = async (req, res) => {
  try {
    const redirectTo = getSafeRedirectTo(req);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
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
    const redirectTo = getSafeRedirectTo(req);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo },
    });
    if (error) throw error;
    return res.status(200).json({ url: data.url });
  } catch (err) {
    console.error('Facebook OAuth error:', err);
    return res.status(500).json({ error: 'Error al iniciar login con Facebook.' });
  }
};

// POST /api/auth/oauth/facebook/token
exports.facebookTokenLogin = async (req, res) => {
  try {
    const { access_token } = req.body;

    if (!access_token)
      return res.status(400).json({ error: 'access_token es requerido.' });

    const fbAppId = String(process.env.FACEBOOK_APP_ID || '').trim();
    const fbAppSecret = String(process.env.FACEBOOK_APP_SECRET || '').trim();

    if (!fbAppId || !fbAppSecret)
      return res.status(500).json({ error: 'Falta configurar FACEBOOK_APP_ID/FACEBOOK_APP_SECRET en backend.' });

    const debugData = await fetchFacebookDebugToken({
      userAccessToken: access_token,
      appId: fbAppId,
      appSecret: fbAppSecret,
    });

    if (!debugData?.is_valid)
      return res.status(401).json({ error: 'El token de Facebook no es valido o ya expiro.' });

    if (String(debugData.app_id || '') !== fbAppId)
      return res.status(401).json({ error: 'El token no pertenece a esta aplicacion de Facebook.' });

    const profile = await fetchFacebookProfile(access_token);
    const email = String(profile?.email || '').trim().toLowerCase();

    if (!email)
      return res.status(400).json({ error: 'Facebook no devolvio email. Revisa permisos public_profile,email y app en modo live.' });

    const nombre = String(profile?.name || email.split('@')[0]).trim();
    const avatarUrl = profile?.picture?.data?.url || null;
    const supabaseAuthId = `facebook:${profile?.id || debugData.user_id || 'unknown'}`;

    const { user: usuario, isNewUser } = await UsuarioModel.upsertOAuth({
      nombre,
      email,
      provider: 'facebook',
      avatarUrl,
      supabaseAuthId,
    });

    if (isNewUser) {
      await PuntosModel.addEntry({
        usuarioId: usuario.id,
        descripcion: 'Bienvenida al programa de lealtad',
        puntos: 1,
      }).catch(e => console.error('Error asignando punto de bienvenida Facebook SDK:', e.message));
    }

    const token = signToken(usuario);

    return res.status(200).json({
      message: 'Login con Facebook exitoso.',
      token,
      is_new_user: !!isNewUser,
      user: sanitizeUser(usuario),
    });
  } catch (err) {
    console.error('Facebook token login error:', err.message);
    const isGraphFailure = String(err.message || '').includes('Facebook ');
    return res.status(isGraphFailure ? 502 : 500).json({
      error: isGraphFailure
        ? `Facebook rechazo la autenticacion: ${err.message}`
        : 'Error del servidor al autenticar con Facebook.',
    });
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

    const { user: usuario, isNewUser } = await UsuarioModel.upsertOAuth({
      nombre,
      email: String(supaUser.email || '').trim().toLowerCase(),
      provider,
      avatarUrl,
      supabaseAuthId: supaUser.id,
    });

    // Regalo de bienvenida: 1 punto por registro OAuth
    if (isNewUser) {
      await PuntosModel.addEntry({
        usuarioId: usuario.id,
        descripcion: 'Bienvenida al programa de lealtad',
        puntos: 1,
      }).catch(e => console.error('Error asignando punto de bienvenida OAuth:', e.message));
    }

    const token = signToken(usuario);

    return res.status(200).json({
      message: 'Login OAuth exitoso.',
      token,
      is_new_user: !!isNewUser,
      user: sanitizeUser(usuario),
    });
  } catch (err) {
    console.error('OAuth callback error:', err.message);
    return res.status(500).json({ error: 'Error del servidor en OAuth callback.' });
  }
};

// DELETE /api/auth/me  (protegida — elimina la cuenta del usuario autenticado)
exports.deleteMe = async (req, res) => {
  try {
    await UsuarioModel.delete(req.user.id);
    return res.status(200).json({ message: 'Cuenta eliminada.' });
  } catch (err) {
    console.error('DeleteMe error:', err.message);
    return res.status(500).json({ error: 'Error al eliminar cuenta.' });
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
    console.error('GetMe error:', err.message);
    return res.status(500).json({ error: 'Error del servidor.' });
  }
};

// PUT /api/auth/update-password  (protegida)
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'La contraseña actual y la nueva contraseña son requeridas.' });

    if (newPassword.length < MIN_PASSWORD_LENGTH)
      return res.status(400).json({ error: `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` });

    if (currentPassword === newPassword)
      return res.status(400).json({ error: 'La nueva contraseña debe ser diferente a la actual.' });

    const usuario = await UsuarioModel.findAuthById(req.user.id);
    if (!usuario)
      return res.status(404).json({ error: 'Usuario no encontrado.' });

    if (!usuario.password_hash)
      return res.status(400).json({ error: 'Tu cuenta usa inicio de sesión social y no tiene contraseña local.' });

    const isValidCurrentPassword = await bcrypt.compare(currentPassword, usuario.password_hash);
    if (!isValidCurrentPassword)
      return res.status(401).json({ error: 'La contraseña actual no es correcta.' });

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await UsuarioModel.update(usuario.id, { passwordHash });

    return res.status(200).json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    console.error('UpdatePassword error:', err.message);
    return res.status(500).json({ error: 'Error del servidor al actualizar la contraseña.' });
  }
};