const { supabaseAdmin } = require('../config/supabase');

const TABLE = 'usuarios';
const PUBLIC_FIELDS = 'id, nombre, email, telefono, tipo_usuario, avatar_url, provider, fecha_registro';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isUUID(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));
}

const UsuarioModel = {
  async findByEmail(email) {
    const normalizedEmail = normalizeEmail(email);
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('*')
      .eq('email', normalizedEmail)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async findById(id) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select(PUBLIC_FIELDS)
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async findAuthById(id) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('id, email, telefono, password_hash, provider')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async findAll({ limit = 100, offset = 0 } = {}) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select(PUBLIC_FIELDS)
      .order('fecha_registro', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return data || [];
  },

  async create({ nombre, email, telefono, passwordHash, tipoUsuario = 'cliente' }) {
    const normalizedEmail = normalizeEmail(email);
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert([{ nombre, email: normalizedEmail, telefono, password_hash: passwordHash, tipo_usuario: tipoUsuario, provider: 'local' }])
      .select(PUBLIC_FIELDS)
      .single();
    if (error) throw error;
    return data;
  },

  async upsertOAuth({ nombre, email, provider, avatarUrl, supabaseAuthId }) {
    const normalizedEmail = normalizeEmail(email);
    const existing = await this.findByEmail(normalizedEmail);

    // supabase_auth_id column is UUID type — only set it when the value is a real UUID
    // (Facebook SDK login generates "facebook:xxx" which is not a UUID)
    const authIdPayload = isUUID(supabaseAuthId) ? { supabase_auth_id: supabaseAuthId } : {};

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from(TABLE)
        .update({
          nombre,
          provider,
          avatar_url: avatarUrl,
          ...authIdPayload,
        })
        .eq('id', existing.id)
        .select(PUBLIC_FIELDS)
        .single();

      if (error) throw error;
      return { user: data, isNewUser: false };
    }

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert([{
        nombre,
        email: normalizedEmail,
        provider,
        avatar_url: avatarUrl,
        ...authIdPayload,
        tipo_usuario: 'cliente',
      }])
      .select(PUBLIC_FIELDS)
      .single();

    if (error) throw error;
    return { user: data, isNewUser: true };
  },

  async update(id, fields) {
    const allowed = {};
    if (fields.nombre !== undefined) allowed.nombre = String(fields.nombre).trim();
    if (fields.passwordHash !== undefined) allowed.password_hash = fields.passwordHash;
    if (fields.telefono !== undefined) allowed.telefono = String(fields.telefono).trim();

    if (Object.keys(allowed).length === 0) throw new Error('No valid fields to update.');

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update(allowed)
      .eq('id', id)
      .select(PUBLIC_FIELDS)
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};

module.exports = UsuarioModel;
