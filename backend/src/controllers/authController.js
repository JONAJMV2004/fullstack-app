const fetch = require('node-fetch');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const UsuarioModel = require('../models/usuarioModel');
const PuntosModel = require('../models/puntosModel');
const { JWT_SECRET } = require('../middleware/auth');
const { enviarCodigoVerificacionPassword, enviarCodigoResetPassword, enviarCodigoRegistro } = require('../config/mailer');

const SALT_ROUNDS = 12;
const TOKEN_EXPIRES_IN = '7d';
const PASSWORD_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutos

// Almacén en memoria: userId -> { code, expiresAt, attempts }
const passwordVerifyCodes = new Map();

// Almacén en memoria para reset (sin login): email -> { code, expiresAt, attempts }
const passwordResetCodes = new Map();

// Almacén en memoria para verificación de registro: email -> { code, expiresAt, attempts, nombre, telefono, passwordHash }
const registerCodes = new Map();

function generateNumericCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i++) code += Math.floor(Math.random() * 10);
  return code;
}
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

// POST /api/auth/register  →  envía código de verificación al email
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

    // Limitar frecuencia: 1 código cada 60 s por email
    const existingCode = registerCodes.get(normalizedEmail);
    if (existingCode && existingCode.expiresAt - Date.now() > PASSWORD_CODE_TTL_MS - 60_000) {
      return res.status(429).json({ error: 'Ya se envió un código recientemente. Espera un momento.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const code = generateNumericCode(6);
    registerCodes.set(normalizedEmail, {
      code,
      expiresAt: Date.now() + PASSWORD_CODE_TTL_MS,
      attempts: 0,
      nombre: nombreFinal,
      telefono: normalizedPhone,
      passwordHash,
    });

    try {
      await enviarCodigoRegistro({ email: normalizedEmail, nombre: nombreFinal, codigo: code });
    } catch (emailErr) {
      console.error('[register] Error de email:', emailErr.message);
      if (process.env.NODE_ENV !== 'development') throw emailErr;
      console.log(`[DEV] Código de registro para ${normalizedEmail}: ${code}`);
    }

    return res.status(200).json({ message: `Código enviado a ${normalizedEmail}`, email: normalizedEmail });
  } catch (err) {
    console.error('Register error:', err.message);
    return res.status(500).json({ error: 'Error del servidor al registrar.' });
  }
};

// POST /api/auth/verify-register  →  valida código y crea la cuenta
exports.verifyRegister = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { verificationCode } = req.body;

    if (!email || !verificationCode)
      return res.status(400).json({ error: 'Email y código son requeridos.' });

    const entry = registerCodes.get(email);
    if (!entry)
      return res.status(400).json({ error: 'No hay un código activo para este email. Inicia el registro de nuevo.' });

    if (Date.now() > entry.expiresAt) {
      registerCodes.delete(email);
      return res.status(400).json({ error: 'El código ha expirado. Inicia el registro de nuevo.' });
    }

    entry.attempts += 1;
    if (entry.attempts > 5) {
      registerCodes.delete(email);
      return res.status(429).json({ error: 'Demasiados intentos. Inicia el registro de nuevo.' });
    }

    if (entry.code !== String(verificationCode).trim())
      return res.status(400).json({ error: `Código incorrecto. Te quedan ${5 - entry.attempts} intentos.` });

    registerCodes.delete(email);

    // Doble verificación: el email no se haya registrado mientras esperaba
    const existing = await UsuarioModel.findByEmail(email);
    if (existing)
      return res.status(409).json({ error: 'Ya existe una cuenta con este email.' });

    const usuario = await UsuarioModel.create({
      nombre: entry.nombre,
      email,
      telefono: entry.telefono,
      passwordHash: entry.passwordHash,
    });

    await PuntosModel.addEntry({
      usuarioId: usuario.id,
      descripcion: 'Bienvenida al programa de lealtad',
      puntos: 1,
    }).catch(e => console.error('Error asignando punto de bienvenida:', e.message));

    const token = signToken(usuario);
    return res.status(201).json({
      message: 'Cuenta creada exitosamente.',
      token,
      user: sanitizeUser(usuario),
    });
  } catch (err) {
    console.error('VerifyRegister error:', err.message);
    return res.status(500).json({ error: 'Error del servidor al crear la cuenta.' });
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

// POST /api/auth/send-password-code  (protegida)
exports.sendPasswordCode = async (req, res) => {
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

    // Limitar frecuencia: un solo código activo por usuario
    const existing = passwordVerifyCodes.get(req.user.id);
    if (existing && existing.expiresAt - Date.now() > PASSWORD_CODE_TTL_MS - 60_000) {
      return res.status(429).json({ error: 'Ya se envió un código recientemente. Espera un momento antes de solicitar otro.' });
    }

    const code = generateNumericCode(6);
    passwordVerifyCodes.set(req.user.id, {
      code,
      expiresAt: Date.now() + PASSWORD_CODE_TTL_MS,
      attempts: 0,
    });

    const usuarioCompleto = await UsuarioModel.findById(req.user.id);
    try {
      await enviarCodigoVerificacionPassword({
        email: usuario.email,
        nombre: usuarioCompleto?.nombre || 'Usuario',
        codigo: code,
      });
    } catch (emailErr) {
      console.error('[sendPasswordCode] Error de email:', emailErr.message);
      if (process.env.NODE_ENV !== 'development') throw emailErr;
      console.log(`[DEV] Código de verificación para ${usuario.email}: ${code}`);
    }

    return res.status(200).json({ message: `Código enviado a ${usuario.email}` });
  } catch (err) {
    console.error('SendPasswordCode error:', err.message);
    return res.status(500).json({ error: 'Error al enviar el código de verificación.' });
  }
};

// PUT /api/auth/update-password  (protegida)
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, verificationCode } = req.body;

    if (!currentPassword || !newPassword || !verificationCode)
      return res.status(400).json({ error: 'Todos los campos son requeridos, incluyendo el código de verificación.' });

    if (newPassword.length < MIN_PASSWORD_LENGTH)
      return res.status(400).json({ error: `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` });

    if (currentPassword === newPassword)
      return res.status(400).json({ error: 'La nueva contraseña debe ser diferente a la actual.' });

    // Validar código
    const entry = passwordVerifyCodes.get(req.user.id);
    if (!entry)
      return res.status(400).json({ error: 'No hay un código de verificación activo. Solicita uno nuevo.' });

    if (Date.now() > entry.expiresAt) {
      passwordVerifyCodes.delete(req.user.id);
      return res.status(400).json({ error: 'El código de verificación ha expirado. Solicita uno nuevo.' });
    }

    entry.attempts += 1;
    if (entry.attempts > 5) {
      passwordVerifyCodes.delete(req.user.id);
      return res.status(429).json({ error: 'Demasiados intentos. Solicita un nuevo código.' });
    }

    if (entry.code !== String(verificationCode).trim()) {
      return res.status(400).json({ error: `Código incorrecto. Te quedan ${5 - entry.attempts} intentos.` });
    }

    // Código válido — eliminar del store
    passwordVerifyCodes.delete(req.user.id);

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

// POST /api/auth/forgot-password  (pública)
exports.forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'El email es requerido.' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ error: 'Email inválido.' });

    // Siempre responder igual para no revelar si el email existe
    const usuario = await UsuarioModel.findByEmail(email);
    if (usuario && usuario.password_hash) {
      // Limitar frecuencia: 1 código cada 60 s por email
      const existing = passwordResetCodes.get(email);
      if (existing && existing.expiresAt - Date.now() > PASSWORD_CODE_TTL_MS - 60_000) {
        return res.status(429).json({ error: 'Ya se envió un código recientemente. Espera un momento.' });
      }

      const code = generateNumericCode(6);
      passwordResetCodes.set(email, {
        code,
        expiresAt: Date.now() + PASSWORD_CODE_TTL_MS,
        attempts: 0,
      });

      try {
        await enviarCodigoResetPassword({ email, nombre: usuario.nombre, codigo: code });
      } catch (emailErr) {
        console.error('[forgotPassword] Error de email:', emailErr.message);
        if (process.env.NODE_ENV !== 'development') throw emailErr;
        console.log(`[DEV] Código de restablecimiento para ${email}: ${code}`);
      }
    }

    return res.status(200).json({ message: 'Si ese email está registrado, recibirás un código de verificación.' });
  } catch (err) {
    console.error('ForgotPassword error:', err.message);
    return res.status(500).json({ error: 'Error del servidor.' });
  }
};

// POST /api/auth/reset-password  (pública)
exports.resetPassword = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { verificationCode, newPassword } = req.body;

    if (!email || !verificationCode || !newPassword)
      return res.status(400).json({ error: 'Todos los campos son requeridos.' });

    if (newPassword.length < MIN_PASSWORD_LENGTH)
      return res.status(400).json({ error: `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` });

    const entry = passwordResetCodes.get(email);
    if (!entry)
      return res.status(400).json({ error: 'No hay un código activo para este email. Solicita uno nuevo.' });

    if (Date.now() > entry.expiresAt) {
      passwordResetCodes.delete(email);
      return res.status(400).json({ error: 'El código ha expirado. Solicita uno nuevo.' });
    }

    entry.attempts += 1;
    if (entry.attempts > 5) {
      passwordResetCodes.delete(email);
      return res.status(429).json({ error: 'Demasiados intentos. Solicita un nuevo código.' });
    }

    if (entry.code !== String(verificationCode).trim()) {
      return res.status(400).json({ error: `Código incorrecto. Te quedan ${5 - entry.attempts} intentos.` });
    }

    passwordResetCodes.delete(email);

    const usuario = await UsuarioModel.findByEmail(email);
    if (!usuario || !usuario.password_hash)
      return res.status(404).json({ error: 'Usuario no encontrado o usa inicio de sesión social.' });

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await UsuarioModel.update(usuario.id, { passwordHash });

    return res.status(200).json({ message: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.' });
  } catch (err) {
    console.error('ResetPassword error:', err.message);
    return res.status(500).json({ error: 'Error del servidor al restablecer la contraseña.' });
  }
};