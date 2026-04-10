const { supabaseAdmin } = require('../config/supabase');

const TABLE = 'estancias';
const UBICACIONES_TABLE = 'ubicaciones';

const EstanciaModel = {
  async create({ usuarioId, fechaCheckIn, fechaCheckOut, puntosGanados, estado = 'confirmada', ubicacion = null }) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert([{
        usuario_id: usuarioId,
        fecha_check_in: fechaCheckIn,
        fecha_check_out: fechaCheckOut,
        puntos_ganados: puntosGanados,
        estado,
        ubicacion: ubicacion || null,
      }])
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async getUbicacionesDisponiblesLegacy() {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('ubicacion')
      .not('ubicacion', 'is', null)
      .order('ubicacion', { ascending: true });

    if (error) throw error;

    const values = (data || [])
      .flatMap((row) => String(row.ubicacion || '').split(','))
      .map((value) => value.trim())
      .filter(Boolean);

    const uniqueByLowercase = new Map();
    for (const value of values) {
      const key = value.toLowerCase();
      if (!uniqueByLowercase.has(key)) uniqueByLowercase.set(key, value);
    }

    return [...uniqueByLowercase.values()].sort((a, b) => a.localeCompare(b, 'es'));
  },

  async getUbicacionesDisponibles() {
    const { data, error } = await supabaseAdmin
      .from(UBICACIONES_TABLE)
      .select('nombre')
      .eq('activa', true)
      .order('nombre', { ascending: true });

    if (error) {
      const fallbackCodes = ['42P01', 'PGRST205'];
      if (fallbackCodes.includes(error.code)) {
        return this.getUbicacionesDisponiblesLegacy();
      }
      throw error;
    }

    const values = (data || [])
      .map((row) => String(row.nombre || '').trim())
      .filter(Boolean);

    const uniqueByLowercase = new Map();
    for (const value of values) {
      const key = value.toLowerCase();
      if (!uniqueByLowercase.has(key)) uniqueByLowercase.set(key, value);
    }

    return [...uniqueByLowercase.values()];
  },

  async existeUbicacion(ubicacion) {
    const ubicacionNormalizada = String(ubicacion || '').trim();
    if (!ubicacionNormalizada) return false;

    const { data, error } = await supabaseAdmin
      .from(UBICACIONES_TABLE)
      .select('id')
      .ilike('nombre', ubicacionNormalizada)
      .eq('activa', true)
      .limit(1);

    if (error) {
      const fallbackCodes = ['42P01', 'PGRST205'];
      if (fallbackCodes.includes(error.code)) {
        const legacy = await this.getUbicacionesDisponiblesLegacy();
        return legacy.some((value) => value.toLowerCase() === ubicacionNormalizada.toLowerCase());
      }
      throw error;
    }

    return (data || []).length > 0;
  },

  async checkConflicto({ ubicacion, fechaCheckIn, fechaCheckOut, excluirId = null }) {
    let query = supabaseAdmin
      .from(TABLE)
      .select('id, fecha_check_in, fecha_check_out, usuario_id')
      .ilike('ubicacion', ubicacion)
      .neq('estado', 'rechazado')
      // Dos rangos se solapan si: check_in existente < check_out nuevo Y check_out existente > check_in nuevo
      .lt('fecha_check_in', fechaCheckOut)
      .gt('fecha_check_out', fechaCheckIn);

    if (excluirId) query = query.neq('id', excluirId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
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
