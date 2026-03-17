const { supabaseAdmin } = require('../config/supabase');

const TABLE = 'premios';

const PremioModel = {
  async getAll() {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('*')
      .gt('disponibilidad', 0)
      .order('puntos_necesarios', { ascending: true });
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

  async decrementDisponibilidad(id) {
    // Decrement con validación de que no baje de 0
    const { data, error } = await supabaseAdmin.rpc('decrement_disponibilidad', { premio_id: id });
    if (error) {
      // Fallback manual si no existe la función RPC
      const premio = await PremioModel.getById(id);
      if (!premio || premio.disponibilidad <= 0) throw new Error('Premio sin disponibilidad.');
      const { data: updated, error: err2 } = await supabaseAdmin
        .from(TABLE)
        .update({ disponibilidad: premio.disponibilidad - 1 })
        .eq('id', id)
        .select('*')
        .single();
      if (err2) throw err2;
      return updated;
    }
    return data;
  },
};

module.exports = PremioModel;
