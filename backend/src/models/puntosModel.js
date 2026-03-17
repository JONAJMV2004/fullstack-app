const { supabaseAdmin } = require('../config/supabase');

const TABLE = 'puntos';

const PuntosModel = {
  // Saldo = suma de todos los movimientos del usuario
  async getBalance(usuarioId) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('puntos')
      .eq('usuario_id', usuarioId);
    if (error) throw error;
    return (data || []).reduce((sum, row) => sum + row.puntos, 0);
  },

  async getHistory(usuarioId) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('fecha', { ascending: false });
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
