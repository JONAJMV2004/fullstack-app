const { supabaseAdmin } = require('../config/supabase');

const TABLE = 'users';

const UserModel = {
  /**
   * Find a user by their email address.
   */
  async findByEmail(email) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
    return data;
  },

  /**
   * Find a user by their ID.
   */
  async findById(id) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('id, name, email, provider, avatar_url, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Create a new local (email/password) user.
   */
  async create({ name, email, passwordHash, provider = 'local', avatarUrl = null }) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert([
        {
          name,
          email,
          password_hash: passwordHash,
          provider,
          avatar_url: avatarUrl,
        },
      ])
      .select('id, name, email, provider, avatar_url, created_at')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Upsert an OAuth user (Google / Facebook).
   * Matches on email — updates name/avatar if user already exists.
   */
  async upsertOAuthUser({ name, email, provider, avatarUrl }) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .upsert(
        [{ name, email, provider, avatar_url: avatarUrl, password_hash: null }],
        { onConflict: 'email', ignoreDuplicates: false }
      )
      .select('id, name, email, provider, avatar_url, created_at')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a user's profile fields.
   */
  async update(id, fields) {
    const allowed = {};
    if (fields.name !== undefined) allowed.name = fields.name;
    if (fields.passwordHash !== undefined) allowed.password_hash = fields.passwordHash;
    if (fields.avatarUrl !== undefined) allowed.avatar_url = fields.avatarUrl;
    allowed.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update(allowed)
      .eq('id', id)
      .select('id, name, email, provider, avatar_url, created_at, updated_at')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a user by ID.
   */
  async delete(id) {
    const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  /**
   * List all users (admin use).
   */
  async findAll() {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('id, name, email, provider, avatar_url, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};

module.exports = UserModel;
