const { supabaseAdmin } = require('../config/supabase');

const TABLE = 'puntos';

const PuntosModel = {
  // Saldo = SUM directamente en SQL (mucho más rápido que descargar todas las filas)
  async getBalance(usuarioId) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('puntos', { count: 'exact' })
      .eq('usuario_id', usuarioId);
    
    if (error) throw error;
    
    // Usar aggregation más eficiente
    const { data: result, error: err } = await supabaseAdmin
      .rpc('get_user_points_balance', { p_usuario_id: usuarioId });
    
    if (err && err.code !== 'PGRST204') {
      // Fallback si la RPC no existe: suma en SQL con aggregation
      const { data: aggregated, error: aggErr } = await supabaseAdmin
        .from(TABLE)
        .select('puntos')
        .eq('usuario_id', usuarioId);
      
      if (aggErr) throw aggErr;
      return (aggregated || []).reduce((sum, row) => sum + row.puntos, 0);
    }
    
    return result?.[0]?.balance || 0;
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
