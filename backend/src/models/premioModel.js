const { supabaseAdmin } = require('../config/supabase');

const TABLE = 'premios';

const PremioModel = {
  async getAll() {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('identificación, nombre, puntos_necesarios, disponibilidad')
      .gt('disponibilidad', 0)
      .order('puntos_necesarios', { ascending: true });
    if (error) throw error;
    return (data || []).map(p => ({ ...p, id: p['identificación'] }));
  },

  async getById(id) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('identificación, nombre, puntos_necesarios, disponibilidad')
      .eq('identificación', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return { ...data, id: data['identificación'] };
  },

  async decrementDisponibilidad(id) {
    const premio = await PremioModel.getById(id);
    if (!premio || premio.disponibilidad <= 0) throw new Error('Premio sin disponibilidad.');
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update({ disponibilidad: premio.disponibilidad - 1 })
      .eq('identificación', id)
      .select('identificación, nombre, puntos_necesarios, disponibilidad')
      .single();
    if (error) throw error;
    return { ...data, id: data['identificación'] };
  },
};

module.exports = PremioModel;
