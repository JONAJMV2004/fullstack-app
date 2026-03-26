const { supabaseAdmin } = require('../config/supabase');

// ── Usuarios ──────────────────────────────────────────────────────────────────

exports.getUsuarios = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('id, nombre, email, tipo_usuario, provider, fecha_registro, avatar_url')
      .order('fecha_registro', { ascending: false });
    if (error) throw error;
    return res.json({ usuarios: data });
  } catch (err) {
    console.error('Admin getUsuarios:', err);
    return res.status(500).json({ error: 'Error al obtener usuarios.' });
  }
};

exports.deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('usuarios').delete().eq('id', id);
    if (error) throw error;
    return res.json({ message: 'Usuario eliminado.' });
  } catch (err) {
    console.error('Admin deleteUsuario:', err);
    return res.status(500).json({ error: 'Error al eliminar usuario.' });
  }
};

// ── Puntos ────────────────────────────────────────────────────────────────────

exports.getPuntos = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('puntos')
      .select('id, usuario_id, puntos, descripcion, fecha, usuarios(nombre, email)')
      .order('fecha', { ascending: false })
      .limit(100);
    if (error) throw error;
    return res.json({ puntos: data });
  } catch (err) {
    console.error('Admin getPuntos:', err);
    return res.status(500).json({ error: 'Error al obtener puntos.' });
  }
};

exports.ajustarPuntos = async (req, res) => {
  try {
    const { usuario_id, puntos, descripcion } = req.body;
    if (!usuario_id || puntos === undefined || !descripcion)
      return res.status(400).json({ error: 'usuario_id, puntos y descripcion son requeridos.' });

    const { data, error } = await supabaseAdmin
      .from('puntos')
      .insert([{ usuario_id, puntos: parseInt(puntos), descripcion }])
      .select('*')
      .single();
    if (error) throw error;
    return res.status(201).json({ message: 'Puntos ajustados.', entry: data });
  } catch (err) {
    console.error('Admin ajustarPuntos:', err);
    return res.status(500).json({ error: 'Error al ajustar puntos.' });
  }
};

// ── Estancias ─────────────────────────────────────────────────────────────────

exports.getEstancias = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('estancias')
      .select('*, usuarios(nombre, email)')
      .order('fecha_check_in', { ascending: false });
    if (error) throw error;
    return res.json({ estancias: data });
  } catch (err) {
    console.error('Admin getEstancias:', err);
    return res.status(500).json({ error: 'Error al obtener estancias.' });
  }
};

exports.updateEstancia = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, puntos_ganados } = req.body;
    const updates = {};
    if (estado !== undefined) updates.estado = estado;
    if (puntos_ganados !== undefined) updates.puntos_ganados = parseInt(puntos_ganados);

    // Fetch current estancia to check previous state
    const { data: current } = await supabaseAdmin
      .from('estancias')
      .select('estado, puntos_ganados, usuario_id, fecha_check_in, fecha_check_out')
      .eq('id', id)
      .single();

    const { data, error } = await supabaseAdmin
      .from('estancias')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;

    // When approving a pending estancia with points, create the points entry
    if (estado === 'aprobado' && current && current.estado !== 'aprobado' && parseInt(puntos_ganados) > 0) {
      const checkIn = new Date(current.fecha_check_in).toLocaleDateString('es-MX');
      const checkOut = new Date(current.fecha_check_out).toLocaleDateString('es-MX');
      await supabaseAdmin
        .from('puntos')
        .insert([{
          usuario_id: current.usuario_id,
          descripcion: `Estancia ${checkIn} – ${checkOut}`,
          puntos: parseInt(puntos_ganados),
        }]);
    }

    return res.json({ message: 'Estancia actualizada.', estancia: data });
  } catch (err) {
    console.error('Admin updateEstancia:', err);
    return res.status(500).json({ error: 'Error al actualizar estancia.' });
  }
};

// ── Premios ───────────────────────────────────────────────────────────────────

exports.getPremios = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('premios')
      .select('id, nombre, puntos_necesarios, disponibilidad')
      .order('id', { ascending: true });
    if (error) throw error;
    return res.json({ premios: data || [] });
  } catch (err) {
    console.error('Admin getPremios:', err);
    return res.status(500).json({ error: 'Error al obtener premios.' });
  }
};

exports.createPremio = async (req, res) => {
  try {
    const { nombre, puntos_necesarios, disponibilidad } = req.body;
    if (!nombre || puntos_necesarios === undefined)
      return res.status(400).json({ error: 'nombre y puntos_necesarios son requeridos.' });

    const { data, error } = await supabaseAdmin
      .from('premios')
      .insert([{ nombre, puntos_necesarios: parseInt(puntos_necesarios), disponibilidad: parseInt(disponibilidad) || 0 }])
      .select('id, nombre, puntos_necesarios, disponibilidad')
      .single();
    if (error) throw error;
    return res.status(201).json({ message: 'Premio creado.', premio: data });
  } catch (err) {
    console.error('Admin createPremio:', err);
    return res.status(500).json({ error: 'Error al crear premio.' });
  }
};

exports.updatePremio = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, puntos_necesarios, disponibilidad } = req.body;
    const updates = {};
    if (nombre !== undefined) updates.nombre = nombre;
    if (puntos_necesarios !== undefined) updates.puntos_necesarios = parseInt(puntos_necesarios);
    if (disponibilidad !== undefined) updates.disponibilidad = parseInt(disponibilidad);

    const { data, error } = await supabaseAdmin
      .from('premios')
      .update(updates)
      .eq('id', id)
      .select('id, nombre, puntos_necesarios, disponibilidad')
      .single();
    if (error) throw error;
    return res.json({ message: 'Premio actualizado.', premio: data });
  } catch (err) {
    console.error('Admin updatePremio:', err);
    return res.status(500).json({ error: 'Error al actualizar premio.' });
  }
};

exports.deletePremio = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('premios').delete().eq('id', id);
    if (error) throw error;
    return res.json({ message: 'Premio eliminado.' });
  } catch (err) {
    console.error('Admin deletePremio:', err);
    return res.status(500).json({ error: 'Error al eliminar premio.' });
  }
};

// ── Canjes ────────────────────────────────────────────────────────────────────

exports.getCanjes = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('canjes')
      .select('*, usuarios(nombre, email), premios(nombre)')
      .order('fecha', { ascending: false });
    if (error) throw error;
    return res.json({ canjes: data });
  } catch (err) {
    console.error('Admin getCanjes:', err);
    return res.status(500).json({ error: 'Error al obtener canjes.' });
  }
};

exports.validarCanje = async (req, res) => {
  try {
    const { codigo } = req.body;
    if (!codigo) return res.status(400).json({ error: 'codigo es requerido.' });

    const { data: canje, error } = await supabaseAdmin
      .from('canjes')
      .select('*, usuarios(nombre, email), premios(nombre)')
      .eq('codigo_unico', codigo.trim().toUpperCase())
      .single();

    if (error || !canje) return res.status(404).json({ error: 'Código no encontrado.' });

    const expiracion = new Date(canje.fecha);
    expiracion.setDate(expiracion.getDate() + 30);
    if (new Date() > expiracion)
      return res.status(410).json({ error: 'Código expirado.', canje });

    if (canje.estado === 'aprobado')
      return res.status(409).json({ error: 'Código ya fue usado.', canje });

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('canjes')
      .update({ estado: 'aprobado' })
      .eq('id', canje.id)
      .select('*, usuarios(nombre, email), premios(nombre)')
      .single();
    if (updateErr) throw updateErr;

    return res.json({ message: 'Código validado exitosamente.', canje: updated });
  } catch (err) {
    console.error('Admin validarCanje:', err);
    return res.status(500).json({ error: 'Error al validar código.' });
  }
};

// ── Reportes ──────────────────────────────────────────────────────────────────

exports.getReportes = async (req, res) => {
  try {
    const [usuariosRes, estanciasRes, canjesRes, puntosRes] = await Promise.all([
      supabaseAdmin.from('usuarios').select('id, fecha_registro', { count: 'exact' }),
      supabaseAdmin.from('estancias').select('id, estado', { count: 'exact' }),
      supabaseAdmin.from('canjes').select('id, estado', { count: 'exact' }),
      supabaseAdmin.from('puntos').select('puntos'),
    ]);

    const totalUsuarios  = usuariosRes.count || 0;
    const totalEstancias = estanciasRes.count || 0;
    const totalCanjes    = canjesRes.count || 0;
    const puntosEmitidos = (puntosRes.data || [])
      .filter(p => p.puntos > 0)
      .reduce((sum, p) => sum + p.puntos, 0);
    const puntosCanjeados = Math.abs(
      (puntosRes.data || [])
        .filter(p => p.puntos < 0)
        .reduce((sum, p) => sum + p.puntos, 0)
    );

    return res.json({
      totalUsuarios,
      totalEstancias,
      totalCanjes,
      puntosEmitidos,
      puntosCanjeados,
    });
  } catch (err) {
    console.error('Admin getReportes:', err);
    return res.status(500).json({ error: 'Error al obtener reportes.' });
  }
};
