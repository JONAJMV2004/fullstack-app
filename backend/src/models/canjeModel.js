const { supabaseAdmin } = require('../config/supabase');

const TABLE = 'canjes';

const CanjeModel = {
  async create({ usuarioId, premioId, puntosUtilizados, codigoUnico }) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert([{
        usuario_id: usuarioId,
        premio_id: premioId,
        puntos_utilizados: puntosUtilizados,
        codigo_unico: codigoUnico,
        estado: 'pendiente',
      }])
      .select('*, premios(nombre)')
      .single();
    if (error) throw error;
    return data;
  },

  async getByUsuario(usuarioId) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('*, premios(nombre)')
      .eq('usuario_id', usuarioId)
      .order('fecha', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getByCodigoUnico(codigoUnico) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('*, premios(nombre), usuarios(nombre, email)')
      .eq('codigo_unico', codigoUnico)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateEstado(id, estado) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update({ estado })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async countByUsuario(usuarioId) {
    const { count, error } = await supabaseAdmin
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('usuario_id', usuarioId);
    if (error) throw error;
    return count || 0;
  },

  async deleteById(id) {
    const { error } = await supabaseAdmin
      .from(TABLE)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

module.exports = CanjeModel;
