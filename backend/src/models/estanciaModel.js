const { supabaseAdmin } = require('../config/supabase');

const TABLE = 'estancias';

const EstanciaModel = {
  async create({ usuarioId, fechaCheckIn, fechaCheckOut, puntosGanados, estado = 'confirmada' }) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert([{
        usuario_id: usuarioId,
        fecha_check_in: fechaCheckIn,
        fecha_check_out: fechaCheckOut,
        puntos_ganados: puntosGanados,
        estado,
      }])
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async getByUsuario(usuarioId) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('fecha_check_in', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
};

module.exports = EstanciaModel;
