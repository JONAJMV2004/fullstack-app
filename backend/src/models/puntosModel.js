const { supabaseAdmin } = require('../config/supabase');

const TABLE = 'puntos';

const PuntosModel = {
  async getBalance(usuarioId) {
    // Try RPC first (fastest — single SQL call)
    const { data: result, error: rpcErr } = await supabaseAdmin
      .rpc('get_user_points_balance', { p_usuario_id: usuarioId });

    if (!rpcErr && result?.[0]?.balance !== undefined) {
      return result[0].balance;
    }

    // Fallback: sum in JS if RPC doesn't exist
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('puntos')
      .eq('usuario_id', usuarioId);

    if (error) throw error;
    return (data || []).reduce((sum, row) => sum + row.puntos, 0);
  },

  async getHistory(usuarioId, { limit = 50, offset = 0 } = {}) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('fecha', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return data;
  },

  async addEntry({ usuarioId, descripcion, puntos }) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert([{ usuario_id: usuarioId, descripcion, puntos }])
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },
};

module.exports = PuntosModel;
