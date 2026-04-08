const { supabaseAdmin } = require('../config/supabase');

const TABLE = 'premios';

const PremioModel = {
  async getAll() {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
<<<<<<< HEAD
      .select('id, nombre, puntos_necesarios, disponibilidad, categoria')
=======
      .select('id, nombre, puntos_necesarios, disponibilidad, imagen_url')
>>>>>>> b82beca75d3230e0ba960ca0b7e8fdc43f703bb9
      .gt('disponibilidad', 0)
      .order('puntos_necesarios', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getById(id) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
<<<<<<< HEAD
      .select('id, nombre, puntos_necesarios, disponibilidad, categoria')
=======
      .select('id, nombre, puntos_necesarios, disponibilidad, imagen_url')
>>>>>>> b82beca75d3230e0ba960ca0b7e8fdc43f703bb9
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async decrementDisponibilidad(id) {
    const premio = await PremioModel.getById(id);
    if (!premio || premio.disponibilidad <= 0) throw new Error('Premio sin disponibilidad.');
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update({ disponibilidad: premio.disponibilidad - 1 })
      .eq('id', id)
      .select('id, nombre, puntos_necesarios, disponibilidad, imagen_url')
      .single();
    if (error) throw error;
    return data;
  },
};

module.exports = PremioModel;
