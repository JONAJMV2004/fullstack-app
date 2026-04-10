const { supabaseAdmin } = require('../config/supabase');
const bcrypt = require('bcryptjs');

const STORAGE_BUCKET_PREMIOS = process.env.SUPABASE_STORAGE_BUCKET_PREMIOS || 'premios';
const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

async function ensurePremiosBucket() {
  const { data: bucket, error } = await supabaseAdmin.storage.getBucket(STORAGE_BUCKET_PREMIOS);

  if (!error && bucket) return;

  const { error: createError } = await supabaseAdmin.storage.createBucket(STORAGE_BUCKET_PREMIOS, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES,
  });

  if (createError && !String(createError.message || '').toLowerCase().includes('already exists')) {
    throw createError;
  }
}

function extractStoragePath(publicUrl) {
  if (!publicUrl) return null;

  const marker = `/object/public/${STORAGE_BUCKET_PREMIOS}/`;
  const markerIndex = publicUrl.indexOf(marker);
  if (markerIndex === -1) return null;

  return publicUrl.slice(markerIndex + marker.length);
}

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

exports.updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_usuario, nombre } = req.body;
    const updates = {};
    if (tipo_usuario !== undefined) {
      const roles = ['cliente', 'admin', 'staff'];
      if (!roles.includes(tipo_usuario))
        return res.status(400).json({ error: 'Rol inválido.' });
      updates.tipo_usuario = tipo_usuario;
    }
    if (nombre !== undefined) updates.nombre = nombre.trim();
    if (!Object.keys(updates).length)
      return res.status(400).json({ error: 'Nada que actualizar.' });

    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .update(updates)
      .eq('id', id)
      .select('id, nombre, email, tipo_usuario, provider, fecha_registro')
      .single();
    if (error) throw error;
    return res.json({ message: 'Usuario actualizado.', usuario: data });
  } catch (err) {
    console.error('Admin updateUsuario:', err);
    return res.status(500).json({ error: 'Error al actualizar usuario.' });
  }
};

exports.cambiarPasswordUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nueva_password } = req.body;
    if (!nueva_password || nueva_password.length < 6)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });

    const hash = await bcrypt.hash(nueva_password, 10);

    const { error } = await supabaseAdmin
      .from('usuarios')
      .update({ password_hash: hash })
      .eq('id', id);
    if (error) throw error;

    return res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    console.error('Admin cambiarPasswordUsuario:', err);
    return res.status(500).json({ error: 'Error al cambiar contraseña.' });
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
    // No se pueden asignar puntos a estancias rechazadas
    if (puntos_ganados !== undefined) updates.puntos_ganados = estado === 'rechazado' ? 0 : parseInt(puntos_ganados);

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

    // Usar el valor del body; si no viene, usar el que ya tiene en BD
    const puntosFinales = puntos_ganados !== undefined
      ? parseInt(puntos_ganados)
      : current?.puntos_ganados ?? 0;

    // When approving a pending estancia with points, create the points entry
    if (estado === 'aprobado' && current?.estado !== 'aprobado' && puntosFinales > 0) {
      const checkIn = new Date(current.fecha_check_in).toLocaleDateString('es-MX');
      const checkOut = new Date(current.fecha_check_out).toLocaleDateString('es-MX');
      await supabaseAdmin
        .from('puntos')
        .insert([{
          usuario_id: current.usuario_id,
          descripcion: `Estancia ${checkIn} – ${checkOut}`,
          puntos: puntosFinales,
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
      .select('id, nombre, descripcion, puntos_necesarios, disponibilidad, categoria, imagen_url')
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
    const { nombre, descripcion, puntos_necesarios, disponibilidad, categoria } = req.body;
    if (!nombre || puntos_necesarios === undefined)
      return res.status(400).json({ error: 'nombre y puntos_necesarios son requeridos.' });

    const premioPayload = {
      nombre: String(nombre).trim(),
      descripcion: descripcion ? String(descripcion).trim() : null,
      puntos_necesarios: parseInt(puntos_necesarios, 10),
      disponibilidad: parseInt(disponibilidad, 10) || 0,
      categoria: String(categoria || 'general').trim() || 'general',
    };

    const { data, error } = await supabaseAdmin
      .from('premios')
      .insert([premioPayload])
      .select('id, nombre, descripcion, puntos_necesarios, disponibilidad, categoria, imagen_url')
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
    const { nombre, descripcion, puntos_necesarios, disponibilidad, categoria } = req.body;
    const updates = {};
    if (nombre !== undefined) updates.nombre = nombre;
    if (descripcion !== undefined) updates.descripcion = descripcion ? String(descripcion).trim() : null;
    if (puntos_necesarios !== undefined) updates.puntos_necesarios = parseInt(puntos_necesarios);
    if (disponibilidad !== undefined) updates.disponibilidad = parseInt(disponibilidad);
    if (categoria !== undefined) updates.categoria = categoria;

    const { data, error } = await supabaseAdmin
      .from('premios')
      .update(updates)
      .eq('id', id)
      .select('id, nombre, descripcion, puntos_necesarios, disponibilidad, categoria, imagen_url')
      .single();
    if (error) throw error;
    return res.json({ message: 'Premio actualizado.', premio: data });
  } catch (err) {
    console.error('Admin updatePremio:', err);
    return res.status(500).json({ error: 'Error al actualizar premio.' });
  }
};

exports.subirImagenPremio = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen.' });

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Formato no permitido. Usa JPG, PNG, GIF o WebP.' });
    }

    const { data: premioActual, error: premioError } = await supabaseAdmin
      .from('premios')
      .select('id, imagen_url')
      .eq('id', id)
      .single();
    if (premioError) throw premioError;
    if (!premioActual) return res.status(404).json({ error: 'Premio no encontrado.' });

    await ensurePremiosBucket();

    const ext = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const path = `${id}/premio-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET_PREMIOS)
      .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
    if (uploadError) throw uploadError;

    const previousPath = extractStoragePath(premioActual.imagen_url);
    if (previousPath) {
      await supabaseAdmin.storage.from(STORAGE_BUCKET_PREMIOS).remove([previousPath]);
    }

    const { data: urlData } = supabaseAdmin.storage.from(STORAGE_BUCKET_PREMIOS).getPublicUrl(path);
    const imagen_url = urlData.publicUrl;

    const { data, error } = await supabaseAdmin
      .from('premios')
      .update({ imagen_url })
      .eq('id', id)
      .select('id, nombre, puntos_necesarios, disponibilidad, categoria, imagen_url')
      .single();
    if (error) throw error;

    return res.json({ message: 'Imagen subida correctamente.', premio: data, imagen_url });
  } catch (err) {
    console.error('Admin subirImagenPremio:', err);
    return res.status(500).json({ error: 'Error al subir la imagen.' });
  }
};

exports.deletePremio = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: premioActual, error: fetchError } = await supabaseAdmin
      .from('premios')
      .select('imagen_url')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;

    const { error } = await supabaseAdmin.from('premios').delete().eq('id', id);
    if (error) throw error;

    const storagePath = extractStoragePath(premioActual?.imagen_url);
    if (storagePath) {
      await supabaseAdmin.storage.from(STORAGE_BUCKET_PREMIOS).remove([storagePath]);
    }

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
      .select('*, usuarios(nombre, email), premios(nombre, categoria)')
      .order('fecha', { ascending: false });
    if (error) throw error;
    return res.json({ canjes: data });
  } catch (err) {
    console.error('Admin getCanjes:', err);
    return res.status(500).json({ error: 'Error al obtener canjes.' });
  }
};

exports.updateCanje = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const estadosValidos = ['aprobado', 'rechazado', 'pendiente'];
    if (!estadosValidos.includes(estado))
      return res.status(400).json({ error: 'Estado inválido.' });

    const { data, error } = await supabaseAdmin
      .from('canjes')
      .update({ estado })
      .eq('id', id)
      .select('*, usuarios(nombre, email), premios(nombre, categoria)')
      .single();
    if (error) throw error;

    return res.json({ message: 'Canje actualizado.', canje: data });
  } catch (err) {
    console.error('Admin updateCanje:', err);
    return res.status(500).json({ error: 'Error al actualizar canje.' });
  }
};

exports.validarCanje = async (req, res) => {
  try {
    const { codigo } = req.body;
    if (!codigo) return res.status(400).json({ error: 'codigo es requerido.' });

    const { data: canje, error } = await supabaseAdmin
      .from('canjes')
      .select('*, usuarios(nombre, email), premios(nombre, categoria)')
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
      .select('*, usuarios(nombre, email), premios(nombre, categoria)')
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

// ── Ubicaciones ──────────────────────────────────────────────────────────────────

exports.getOcupacion = async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];

    const [{ data: ubicaciones, error: errUb }, { data: estancias, error: errEst }] = await Promise.all([
      supabaseAdmin.from('ubicaciones').select('id, nombre, activa').order('nombre', { ascending: true }),
      supabaseAdmin
        .from('estancias')
        .select('id, ubicacion, estado, fecha_check_in, fecha_check_out, usuario_id, usuarios(nombre, email)')
        .neq('estado', 'rechazado')
        .gte('fecha_check_out', hoy)
        .order('fecha_check_in', { ascending: true }),
    ]);

    if (errUb) throw errUb;
    if (errEst) throw errEst;

    const resultado = (ubicaciones || []).map(ub => {
      const estanciasUb = (estancias || []).filter(
        e => (e.ubicacion || '').toLowerCase() === ub.nombre.toLowerCase()
      );

      const activa = estanciasUb.find(
        e => e.fecha_check_in <= hoy && e.fecha_check_out >= hoy && e.estado === 'aprobado'
      );
      const proximaAprobada = estanciasUb.find(e => e.fecha_check_in > hoy && e.estado === 'aprobado');
      const pendiente = estanciasUb.find(e => e.estado === 'pendiente');

      let estadoUb = 'disponible';
      if (activa) estadoUb = 'ocupada';
      else if (proximaAprobada || pendiente) estadoUb = 'reservada';

      return {
        ...ub,
        estado_ocupacion: estadoUb,
        estancias: estanciasUb,
      };
    });

    return res.json({ ubicaciones: resultado });
  } catch (err) {
    console.error('Admin getOcupacion:', err);
    return res.status(500).json({ error: 'Error al obtener ocupación.' });
  }
};

exports.getUbicaciones = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('ubicaciones')
      .select('id, nombre, activa')
      .order('nombre', { ascending: true });
    if (error) throw error;
    return res.json({ ubicaciones: data || [] });
  } catch (err) {
    console.error('Admin getUbicaciones:', err);
    return res.status(500).json({ error: 'Error al obtener ubicaciones.' });
  }
};

exports.createUbicacion = async (req, res) => {
  try {
    const nombre = String(req.body.nombre || '').trim();
    if (!nombre)
      return res.status(400).json({ error: 'nombre es requerido.' });

    const { data, error } = await supabaseAdmin
      .from('ubicaciones')
      .insert([{ nombre }])
      .select('id, nombre, activa')
      .single();
    if (error) throw error;
    return res.status(201).json({ message: 'Ubicación creada.', ubicacion: data });
  } catch (err) {
    console.error('Admin createUbicacion:', err);
    return res.status(500).json({ error: 'Error al crear ubicación.' });
  }
};

exports.updateUbicacion = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    if (req.body.nombre !== undefined) updates.nombre = String(req.body.nombre).trim();
    if (req.body.activa !== undefined) updates.activa = Boolean(req.body.activa);

    if (!Object.keys(updates).length)
      return res.status(400).json({ error: 'Nada que actualizar.' });

    const { data, error } = await supabaseAdmin
      .from('ubicaciones')
      .update(updates)
      .eq('id', id)
      .select('id, nombre, activa')
      .single();
    if (error) throw error;
    return res.json({ message: 'Ubicación actualizada.', ubicacion: data });
  } catch (err) {
    console.error('Admin updateUbicacion:', err);
    return res.status(500).json({ error: 'Error al actualizar ubicación.' });
  }
};

exports.deleteUbicacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('ubicaciones').delete().eq('id', id);
    if (error) throw error;
    return res.json({ message: 'Ubicación eliminada.' });
  } catch (err) {
    console.error('Admin deleteUbicacion:', err);
    return res.status(500).json({ error: 'Error al eliminar ubicación.' });
  }
};