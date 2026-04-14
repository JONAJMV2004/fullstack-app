const { supabaseAdmin } = require('../config/supabase');

const TABLE = 'premios';

const PremioModel = {
  async getAll() {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('id, nombre, descripcion, puntos_necesarios, disponibilidad, categoria, imagen_url')
      .gt('disponibilidad', 0)
      .order('puntos_necesarios', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getById(id) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('id, nombre, descripcion, puntos_necesarios, disponibilidad, categoria, imagen_url')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async decrementDisponibilidad(id) {
    // Atomic: only decrement if disponibilidad > 0 (prevents race conditions)
    const { data, error } = await supabaseAdmin
      .rpc('decrement_premio_disponibilidad', { p_premio_id: id });

    if (!error && data?.[0]) return data[0];

    // Fallback if RPC doesn't exist: read-then-write (less safe but functional)
    const premio = await PremioModel.getById(id);
    if (!premio || premio.disponibilidad <= 0) throw new Error('Premio sin disponibilidad.');
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from(TABLE)
      .update({ disponibilidad: premio.disponibilidad - 1 })
      .eq('id', id)
      .gt('disponibilidad', 0)
      .select('id, nombre, puntos_necesarios, disponibilidad, imagen_url')
      .single();
    if (updateErr) throw updateErr;
    if (!updated) throw new Error('Premio sin disponibilidad.');
    return updated;
  },

  async incrementDisponibilidad(id) {
    const premio = await PremioModel.getById(id);
    if (!premio) throw new Error('Premio no encontrado.');
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update({ disponibilidad: premio.disponibilidad + 1 })
      .eq('id', id)
      .select('id, disponibilidad')
      .single();
    if (error) throw error;
    return data;
  },
};

module.exports = PremioModel;
