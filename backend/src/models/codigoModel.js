const { supabaseAdmin } = require('../config/supabase');

const TABLE = 'codigos';

const CodigoModel = {
  async create({ codigo, ubicacion, fechaIngreso, fechaSalida, noches, puntos }) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert([{
        codigo: String(codigo).trim().toUpperCase(),
        ubicacion: String(ubicacion).trim(),
        fecha_ingreso: fechaIngreso,
        fecha_salida: fechaSalida,
        noches: parseInt(noches),
        puntos: parseInt(puntos),
      }])
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async getAll() {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('*, usuarios(nombre, email)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getByUsuario(usuarioId) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('estatus', 'canjeado')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getByCodigo(codigo) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('*')
      .eq('codigo', String(codigo).trim().toUpperCase())
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async canjear(id, usuarioId) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update({ estatus: 'canjeado', usuario_id: usuarioId })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async guardarResena(id, usuarioId, { calificacion, comentario }) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update({ calificacion: parseInt(calificacion), comentario: String(comentario || '').trim() || null })
      .eq('id', id)
      .eq('usuario_id', usuarioId) // solo el dueño puede calificar
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  },

  async countCanjeadosByUsuario(usuarioId) {
    const { count, error } = await supabaseAdmin
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('usuario_id', usuarioId)
      .eq('estatus', 'canjeado');
    if (error) throw error;
    return count || 0;
  },
};

module.exports = CodigoModel;
