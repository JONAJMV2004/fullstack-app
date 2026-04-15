const { supabaseAdmin } = require('../config/supabase');

const TABLE = 'notificaciones';

exports.create = async ({ usuarioId, tipo, titulo, mensaje }) => {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .insert([{ usuario_id: usuarioId, tipo, titulo, mensaje }])
    .select('*')
    .single();
  if (error) throw error;
  return data;
};

exports.createMany = async (rows) => {
  if (!rows.length) return [];
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .insert(rows.map(r => ({
      usuario_id: r.usuarioId,
      tipo: r.tipo || 'general',
      titulo: r.titulo,
      mensaje: r.mensaje || null,
    })))
    .select('*');
  if (error) throw error;
  return data;
};

exports.getByUsuario = async (usuarioId, { limit = 50, offset = 0 } = {}) => {
  const { data, error, count } = await supabaseAdmin
    .from(TABLE)
    .select('*', { count: 'exact' })
    .eq('usuario_id', usuarioId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return { notificaciones: data, total: count };
};

exports.countUnread = async (usuarioId) => {
  const { count, error } = await supabaseAdmin
    .from(TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('usuario_id', usuarioId)
    .eq('leida', false);
  if (error) throw error;
  return count || 0;
};

exports.markAsRead = async (id, usuarioId) => {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update({ leida: true })
    .eq('id', id)
    .eq('usuario_id', usuarioId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
};

exports.markAllAsRead = async (usuarioId) => {
  const { error } = await supabaseAdmin
    .from(TABLE)
    .update({ leida: true })
    .eq('usuario_id', usuarioId)
    .eq('leida', false);
  if (error) throw error;
};

exports.deleteById = async (id, usuarioId) => {
  const { error } = await supabaseAdmin
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('usuario_id', usuarioId);
  if (error) throw error;
};
