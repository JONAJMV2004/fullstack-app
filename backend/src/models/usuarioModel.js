const { supabaseAdmin } = require('../config/supabase');

const TABLE = 'usuarios';

const UsuarioModel = {
  async findByEmail(email) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('*')
      .eq('email', email)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async findById(id) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('id, nombre, email, telefono, tipo_usuario, avatar_url, provider, fecha_registro')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async findAuthById(id) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('id, email, password_hash, provider')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create({ nombre, email, passwordHash, tipoUsuario = 'cliente' }) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert([{ nombre, email, password_hash: passwordHash, tipo_usuario: tipoUsuario, provider: 'local' }])
      .select('id, nombre, email, tipo_usuario, provider, fecha_registro')
      .single();
    if (error) throw error;
    return data;
  },

  async upsertOAuth({ nombre, email, provider, avatarUrl, supabaseAuthId }) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .upsert(
        [{ nombre, email, provider, avatar_url: avatarUrl, supabase_auth_id: supabaseAuthId, tipo_usuario: 'cliente' }],
        { onConflict: 'email', ignoreDuplicates: false }
      )
      .select('id, nombre, email, tipo_usuario, provider, avatar_url, fecha_registro')
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, fields) {
    const allowed = {};
    if (fields.nombre !== undefined) allowed.nombre = fields.nombre;
    if (fields.passwordHash !== undefined) allowed.password_hash = fields.passwordHash;
    if (fields.telefono !== undefined) allowed.telefono = fields.telefono;

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update(allowed)
      .eq('id', id)
      .select('id, nombre, email, tipo_usuario, provider, avatar_url, fecha_registro')
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
