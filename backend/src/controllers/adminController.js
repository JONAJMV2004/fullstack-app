const { supabaseAdmin } = require('../config/supabase');
const bcrypt = require('bcryptjs');
const CodigoModel = require('../models/codigoModel');
const { enviarCorreoEstanciaAprobada, enviarCorreoCanjeAprobado, enviarCorreoMarketing, enviarCorreoCanjeEntregado } = require('../config/mailer');
const { enviarNotificacion } = require('../services/notificacionService');

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
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

// â”€â”€ Usuarios â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

exports.getUsuarios = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 500);
    const offset = parseInt(req.query.offset, 10) || 0;
    const { data, error, count } = await supabaseAdmin
      .from('usuarios')
      .select('id, nombre, email, tipo_usuario, provider, fecha_registro, avatar_url', { count: 'exact' })
      .order('fecha_registro', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return res.json({ usuarios: data, total: count });
  } catch (err) {
    console.error('Admin getUsuarios:', err.message);
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
    console.error('Admin deleteUsuario:', err.message);
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
        return res.status(400).json({ error: 'Rol invÃ¡lido.' });
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
    console.error('Admin updateUsuario:', err.message);
    return res.status(500).json({ error: 'Error al actualizar usuario.' });
  }
};

exports.cambiarPasswordUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nueva_password } = req.body;
    if (!nueva_password || nueva_password.length < MIN_PASSWORD_LENGTH)
      return res.status(400).json({ error: `La contraseÃ±a debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` });

    const hash = await bcrypt.hash(nueva_password, SALT_ROUNDS);

    const { error } = await supabaseAdmin
      .from('usuarios')
      .update({ password_hash: hash })
      .eq('id', id);
    if (error) throw error;

    return res.json({ message: 'ContraseÃ±a actualizada correctamente.' });
  } catch (err) {
    console.error('Admin cambiarPasswordUsuario:', err.message);
    return res.status(500).json({ error: 'Error al cambiar contraseÃ±a.' });
  }
};

// â”€â”€ Puntos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    console.error('Admin getPuntos:', err.message);
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
    console.error('Admin ajustarPuntos:', err.message);
    return res.status(500).json({ error: 'Error al ajustar puntos.' });
  }
};

// â”€â”€ Estancias â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

exports.getEstancias = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 500);
    const offset = parseInt(req.query.offset, 10) || 0;
    const { data, error, count } = await supabaseAdmin
      .from('estancias')
      .select('*, usuarios(nombre, email)', { count: 'exact' })
      .order('fecha_check_in', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return res.json({ estancias: data, total: count });
  } catch (err) {
    console.error('Admin getEstancias:', err.message);
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
      .select('estado, puntos_ganados, usuario_id, fecha_check_in, fecha_check_out, noches, usuarios(nombre, email)')
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
          descripcion: `Estancia ${checkIn} â€“ ${checkOut}`,
          puntos: puntosFinales,
        }]);

      // Enviar correo de confirmacion al huesped
      if (current?.usuarios?.email) {
        enviarCorreoEstanciaAprobada({
          email: current.usuarios.email,
          nombre: current.usuarios.nombre || 'Huesped',
          checkIn,
          checkOut,
          noches: current.noches ?? 'â€”',
          puntos: puntosFinales,
        }).catch(err => console.error('Error enviando correo estancia:', err));
      }

      // Notificación en tiempo real
      enviarNotificacion({
        usuarioId: current.usuario_id,
        tipo: 'estancia',
        titulo: 'Estancia aprobada',
        mensaje: `Tu estancia (${checkIn} – ${checkOut}) fue aprobada. +${puntosFinales} puntos.`,
      }).catch(e => console.error('Notif error:', e.message));
    }

    return res.json({ message: 'Estancia actualizada.', estancia: data });
  } catch (err) {
    console.error('Admin updateEstancia:', err.message);
    return res.status(500).json({ error: 'Error al actualizar estancia.' });
  }
};

// â”€â”€ Premios â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

exports.getPremios = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('premios')
      .select('id, nombre, descripcion, puntos_necesarios, disponibilidad, categoria, imagen_url')
      .order('id', { ascending: true });
    if (error) throw error;
    return res.json({ premios: data || [] });
  } catch (err) {
    console.error('Admin getPremios:', err.message);
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
    console.error('Admin createPremio:', err.message);
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
    console.error('Admin updatePremio:', err.message);
    return res.status(500).json({ error: 'Error al actualizar premio.' });
  }
};

exports.subirImagenPremio = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No se recibiÃ³ ninguna imagen.' });

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
    console.error('Admin subirImagenPremio:', err.message);
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
    console.error('Admin deletePremio:', err.message);
    return res.status(500).json({ error: 'Error al eliminar premio.' });
  }
};

// â”€â”€ Canjes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

exports.getCanjes = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 500);
    const offset = parseInt(req.query.offset, 10) || 0;
    const { data, error, count } = await supabaseAdmin
      .from('canjes')
      .select('*, usuarios(nombre, email), premios(nombre, categoria)', { count: 'exact' })
      .order('fecha', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return res.json({ canjes: data, total: count });
  } catch (err) {
    console.error('Admin getCanjes:', err.message);
    return res.status(500).json({ error: 'Error al obtener canjes.' });
  }
};

exports.updateCanje = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const estadosValidos = ['aprobado', 'rechazado', 'pendiente', 'entregado'];
    if (!estadosValidos.includes(estado))
      return res.status(400).json({ error: 'Estado invÃ¡lido.' });

    const { data, error } = await supabaseAdmin
      .from('canjes')
      .update({ estado })
      .eq('id', id)
      .select('*, usuarios(nombre, email), premios(nombre, categoria)')
      .single();
    if (error) throw error;

    // Enviar correo según el nuevo estado
    if (data?.usuarios?.email) {
      if (estado === 'aprobado') {
        enviarCorreoCanjeAprobado({
          email: data.usuarios.email,
          nombre: data.usuarios.nombre || 'Usuario',
          premio: data.premios?.nombre || 'Premio',
          codigoUnico: data.codigo_unico,
        }).catch(err => console.error('Error enviando correo canje aprobado:', err));

        // Notificación en tiempo real
        enviarNotificacion({
          usuarioId: data.usuario_id,
          tipo: 'canje',
          titulo: 'Canje aprobado',
          mensaje: `Tu canje de "${data.premios?.nombre || 'Premio'}" fue aprobado. Código: ${data.codigo_unico}`,
        }).catch(e => console.error('Notif error:', e.message));
      } else if (estado === 'entregado') {
        enviarCorreoCanjeEntregado({
          email: data.usuarios.email,
          nombre: data.usuarios.nombre || 'Usuario',
          premio: data.premios?.nombre || 'Premio',
        }).catch(err => console.error('Error enviando correo canje entregado:', err));
      }
    }

    return res.json({ message: 'Canje actualizado.', canje: data });
  } catch (err) {
    console.error('Admin updateCanje:', err.message);
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

    if (error || !canje) return res.status(404).json({ error: 'CÃ³digo no encontrado.' });

    const expiracion = new Date(canje.fecha);
    expiracion.setDate(expiracion.getDate() + 30);
    if (new Date() > expiracion)
      return res.status(410).json({ error: 'CÃ³digo expirado.', canje });

    if (canje.estado === 'aprobado')
      return res.status(409).json({ error: 'CÃ³digo ya fue usado.', canje });

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('canjes')
      .update({ estado: 'aprobado' })
      .eq('id', canje.id)
      .select('*, usuarios(nombre, email), premios(nombre, categoria)')
      .single();
    if (updateErr) throw updateErr;

    return res.json({ message: 'CÃ³digo validado exitosamente.', canje: updated });
  } catch (err) {
    console.error('Admin validarCanje:', err.message);
    return res.status(500).json({ error: 'Error al validar cÃ³digo.' });
  }
};

// â”€â”€ Reportes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    console.error('Admin getReportes:', err.message);
    return res.status(500).json({ error: 'Error al obtener reportes.' });
  }
};

// â”€â”€ Ubicaciones â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

exports.getOcupacion = async (req, res) => {
  try {
    const d = new Date();
    const hoy = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

    const [{ data: ubicaciones, error: errUb }, { data: codigos, error: errCod }] = await Promise.all([
      supabaseAdmin.from('ubicaciones').select('id, nombre, activa').order('nombre', { ascending: true }),
      supabaseAdmin
        .from('codigos')
        .select('id, ubicacion, estatus, fecha_ingreso, fecha_salida, noches, puntos, usuario_id, usuarios(nombre, email)')
        .eq('estatus', 'canjeado')
        .gte('fecha_salida', hoy)
        .order('fecha_ingreso', { ascending: true }),
    ]);

    if (errUb) throw errUb;
    if (errCod) throw errCod;

    const resultado = (ubicaciones || []).map(ub => {
      const codigosUb = (codigos || []).filter(
        c => (c.ubicacion || '').toLowerCase() === ub.nombre.toLowerCase()
      );

      // Normalizar a YYYY-MM-DD para comparaciÃ³n segura sin problemas de timezone
      const norm = (d) => String(d || '').substring(0, 10);

      const actual = codigosUb.find(
        c => norm(c.fecha_ingreso) <= hoy && norm(c.fecha_salida) >= hoy
      );
      const proximas = codigosUb.filter(c => norm(c.fecha_ingreso) > hoy);

      let estadoUb = 'disponible';
      if (actual) estadoUb = 'ocupada';
      else if (proximas.length > 0) estadoUb = 'reservada';

      // Mapear al formato que espera el frontend
      const estancias = codigosUb.map(c => ({
        id: c.id,
        fecha_check_in: c.fecha_ingreso,
        fecha_check_out: c.fecha_salida,
        estado: 'canjeado',
        noches: c.noches,
        puntos: c.puntos,
        usuario_id: c.usuario_id,
        usuarios: c.usuarios,
      }));

      return {
        ...ub,
        estado_ocupacion: estadoUb,
        estancias,
      };
    });

    return res.json({ ubicaciones: resultado });
  } catch (err) {
    console.error('Admin getOcupacion:', err.message);
    return res.status(500).json({ error: 'Error al obtener ocupaciÃ³n.' });
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
    console.error('Admin getUbicaciones:', err.message);
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
    return res.status(201).json({ message: 'UbicaciÃ³n creada.', ubicacion: data });
  } catch (err) {
    console.error('Admin createUbicacion:', err.message);
    return res.status(500).json({ error: 'Error al crear ubicaciÃ³n.' });
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
    return res.json({ message: 'UbicaciÃ³n actualizada.', ubicacion: data });
  } catch (err) {
    console.error('Admin updateUbicacion:', err.message);
    return res.status(500).json({ error: 'Error al actualizar ubicaciÃ³n.' });
  }
};

exports.deleteUbicacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('ubicaciones').delete().eq('id', id);
    if (error) throw error;
    return res.json({ message: 'UbicaciÃ³n eliminada.' });
  } catch (err) {
    console.error('Admin deleteUbicacion:', err.message);
    return res.status(500).json({ error: 'Error al eliminar ubicaciÃ³n.' });
  }
};

// â”€â”€ AnalÃ­tica de Puntos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

exports.getAnalitica = async (req, res) => {
  try {
    const { mes } = req.query; // formato: "2026-04"

    const [{ data: todosPuntos, error: errP }, { data: codigos, error: errC }] = await Promise.all([
      supabaseAdmin
        .from('puntos')
        .select('usuario_id, puntos, descripcion, fecha, usuarios(nombre, email)')
        .order('fecha', { ascending: false }),
      supabaseAdmin
        .from('codigos')
        .select('ubicacion, fecha_ingreso, noches, puntos, usuario_id, usuarios(nombre, email)')
        .eq('estatus', 'canjeado')
        .order('fecha_ingreso', { ascending: false }),
    ]);

    if (errP) throw errP;
    if (errC) throw errC;

    const puntos  = todosPuntos || [];
    const codigosTodos = codigos || [];

    // Filtrar por mes si se pasa
    const puntosMes  = mes ? puntos.filter(p  => String(p.fecha        || '').startsWith(mes)) : puntos;
    const codigosMes = mes ? codigosTodos.filter(c => String(c.fecha_ingreso || '').startsWith(mes)) : codigosTodos;

    // â”€â”€ Top usuarios por puntos ganados (desde codigos canjeados) â”€â”€
    const mapaUsuarios = {};
    codigosTodos.filter(c => c.usuario_id).forEach(c => {
      const id = c.usuario_id;
      if (!mapaUsuarios[id]) {
        mapaUsuarios[id] = {
          nombre: c.usuarios?.nombre || `Usuario ${id}`,
          email:  c.usuarios?.email  || 'â€”',
          total:  0,
          movimientos: 0,
        };
      }
      mapaUsuarios[id].total      += c.puntos || 0;
      mapaUsuarios[id].movimientos++;
    });
    const topUsuarios = Object.values(mapaUsuarios).sort((a, b) => b.total - a.total).slice(0, 10);

    // â”€â”€ EstadÃ­as por ubicaciÃ³n en el mes â”€â”€
    const mapaUbicaciones = {};
    codigosMes.forEach(c => {
      const ub = c.ubicacion || 'Sin ubicaciÃ³n';
      if (!mapaUbicaciones[ub]) mapaUbicaciones[ub] = { ubicacion: ub, estadias: 0, noches: 0, puntos: 0 };
      mapaUbicaciones[ub].estadias++;
      mapaUbicaciones[ub].noches  += c.noches || 0;
      mapaUbicaciones[ub].puntos  += c.puntos || 0;
    });
    const ubicacionesMes = Object.values(mapaUbicaciones).sort((a, b) => b.estadias - a.estadias);

    // â”€â”€ Puntos asignados en el mes con detalle â”€â”€
    const asignadosMes = puntosMes.filter(p => p.puntos > 0).slice(0, 100);

    // â”€â”€ Tendencia mensual Ãºltimos 6 meses â”€â”€
    const tendencia = {};
    const ahora = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
      tendencia[key] = { mes: key, label, estadias: 0, puntos: 0 };
    }
    codigosTodos.forEach(c => {
      const key = String(c.fecha_ingreso || '').substring(0, 7);
      if (tendencia[key]) {
        tendencia[key].estadias++;
        tendencia[key].puntos += c.puntos || 0;
      }
    });

    // â”€â”€ Resumen general â”€â”€
    const totalEmitidos  = puntos.filter(p => p.puntos > 0).reduce((s, p) => s + p.puntos, 0);
    const totalCanjeados = Math.abs(puntos.filter(p => p.puntos < 0).reduce((s, p) => s + p.puntos, 0));

    return res.json({
      topUsuarios,
      ubicacionesMes,
      asignadosMes,
      tendencia: Object.values(tendencia),
      resumen: { totalEmitidos, totalCanjeados, estadiasMes: codigosMes.length, puntosMes: asignadosMes.reduce((s, p) => s + p.puntos, 0) },
    });
  } catch (err) {
    console.error('Admin getAnalitica:', err.message);
    return res.status(500).json({ error: 'Error al obtener analÃ­tica.' });
  }
};

// â”€â”€ CÃ³digos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

exports.getCodigos = async (req, res) => {
  try {
    const codigos = await CodigoModel.getAll();
    return res.json({ codigos });
  } catch (err) {
    console.error('Admin getCodigos:', err.message);
    return res.status(500).json({ error: 'Error al obtener cÃ³digos.' });
  }
};

exports.createCodigo = async (req, res) => {
  try {
    const { codigo, ubicacion, fecha_ingreso, fecha_salida, noches, puntos } = req.body;

    if (!codigo || !ubicacion || !fecha_ingreso || !fecha_salida || noches === undefined || puntos === undefined)
      return res.status(400).json({ error: 'codigo, ubicacion, fecha_ingreso, fecha_salida, noches y puntos son requeridos.' });

    if (parseInt(noches) <= 0)
      return res.status(400).json({ error: 'Las noches deben ser mayor a 0.' });

    if (parseInt(puntos) < 0)
      return res.status(400).json({ error: 'Los puntos no pueden ser negativos.' });

    const nuevo = await CodigoModel.create({
      codigo,
      ubicacion,
      fechaIngreso: fecha_ingreso,
      fechaSalida: fecha_salida,
      noches,
      puntos,
    });
    return res.status(201).json({ message: 'CÃ³digo creado.', codigo: nuevo });
  } catch (err) {
    console.error('Admin createCodigo:', err.message);
    if (err.code === '23505')
      return res.status(409).json({ error: 'Ya existe un cÃ³digo con ese nombre.' });
    return res.status(500).json({ error: 'Error al crear cÃ³digo.' });
  }
};

exports.deleteCodigo = async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir eliminar un cÃ³digo ya canjeado
    const { data: existente } = await supabaseAdmin
      .from('codigos')
      .select('estatus')
      .eq('id', id)
      .single();

    if (existente?.estatus === 'canjeado')
      return res.status(409).json({ error: 'No se puede eliminar un cÃ³digo ya canjeado.' });

    await CodigoModel.delete(id);
    return res.json({ message: 'CÃ³digo eliminado.' });
  } catch (err) {
    console.error('Admin deleteCodigo:', err.message);
    return res.status(500).json({ error: 'Error al eliminar cÃ³digo.' });
  }
};

// POST /admin/marketing â€” envÃ­o masivo de correos a todos los clientes
exports.enviarMarketing = async (req, res) => {
  try {
    const { asunto, mensaje, imagenUrl } = req.body;
    if (!asunto?.trim() || !mensaje?.trim())
      return res.status(400).json({ error: 'El asunto y el mensaje son requeridos.' });

    // Obtener todos los usuarios clientes con email
    const { data: usuarios, error } = await supabaseAdmin
      .from('usuarios')
      .select('email, nombre')
      .eq('tipo_usuario', 'cliente')
      .not('email', 'is', null);

    if (error) throw error;
    if (!usuarios?.length)
      return res.json({ message: 'No hay clientes registrados.', enviados: 0, fallidos: 0 });

    const emails = usuarios.map(u => u.email);
    const resultados = await enviarCorreoMarketing({
      emails,
      asunto: asunto.trim(),
      mensaje: mensaje.trim(),
      imagenUrl: imagenUrl?.trim() || null,
    });

    return res.json({
      message: `CampaÃ±a enviada: ${resultados.enviados} correos entregados, ${resultados.fallidos} fallidos.`,
      total: emails.length,
      ...resultados,
    });
  } catch (err) {
    console.error('Admin enviarMarketing:', err.message);
    return res.status(500).json({ error: 'Error al enviar la campaÃ±a.' });
  }
};
