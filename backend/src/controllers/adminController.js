const { supabaseAdmin } = require('../config/supabase');
const bcrypt = require('bcryptjs');
const CodigoModel = require('../models/codigoModel');
const { enviarCorreoEstanciaAprobada, enviarCorreoCanjeAprobado, enviarCorreoMarketing, enviarCorreoCanjeEntregado } = require('../config/mailer');

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
          descripcion: `Estancia ${checkIn} – ${checkOut}`,
          puntos: puntosFinales,
        }]);

      // Enviar correo de confirmacion al huesped
      if (current?.usuarios?.email) {
        enviarCorreoEstanciaAprobada({
          email: current.usuarios.email,
          nombre: current.usuarios.nombre || 'Huesped',
          checkIn,
          checkOut,
          noches: current.noches ?? '—',
          puntos: puntosFinales,
        }).catch(err => console.error('Error enviando correo estancia:', err));
      }
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
    const estadosValidos = ['aprobado', 'rechazado', 'pendiente', 'entregado'];
    if (!estadosValidos.includes(estado))
      return res.status(400).json({ error: 'Estado inválido.' });

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

      // Normalizar a YYYY-MM-DD para comparación segura sin problemas de timezone
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

// ── Analítica de Puntos ───────────────────────────────────────────────────────

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

    // ── Top usuarios por puntos ganados (desde codigos canjeados) ──
    const mapaUsuarios = {};
    codigosTodos.filter(c => c.usuario_id).forEach(c => {
      const id = c.usuario_id;
      if (!mapaUsuarios[id]) {
        mapaUsuarios[id] = {
          nombre: c.usuarios?.nombre || `Usuario ${id}`,
          email:  c.usuarios?.email  || '—',
          total:  0,
          movimientos: 0,
        };
      }
      mapaUsuarios[id].total      += c.puntos || 0;
      mapaUsuarios[id].movimientos++;
    });
    const topUsuarios = Object.values(mapaUsuarios).sort((a, b) => b.total - a.total).slice(0, 10);

    // ── Estadías por ubicación en el mes ──
    const mapaUbicaciones = {};
    codigosMes.forEach(c => {
      const ub = c.ubicacion || 'Sin ubicación';
      if (!mapaUbicaciones[ub]) mapaUbicaciones[ub] = { ubicacion: ub, estadias: 0, noches: 0, puntos: 0 };
      mapaUbicaciones[ub].estadias++;
      mapaUbicaciones[ub].noches  += c.noches || 0;
      mapaUbicaciones[ub].puntos  += c.puntos || 0;
    });
    const ubicacionesMes = Object.values(mapaUbicaciones).sort((a, b) => b.estadias - a.estadias);

    // ── Puntos asignados en el mes con detalle ──
    const asignadosMes = puntosMes.filter(p => p.puntos > 0).slice(0, 100);

    // ── Tendencia mensual últimos 6 meses ──
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

    // ── Resumen general ──
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
    console.error('Admin getAnalitica:', err);
    return res.status(500).json({ error: 'Error al obtener analítica.' });
  }
};

// ── Códigos ──────────────────────────────────────────────────────────────────

exports.getCodigos = async (req, res) => {
  try {
    const codigos = await CodigoModel.getAll();
    return res.json({ codigos });
  } catch (err) {
    console.error('Admin getCodigos:', err);
    return res.status(500).json({ error: 'Error al obtener códigos.' });
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
    return res.status(201).json({ message: 'Código creado.', codigo: nuevo });
  } catch (err) {
    console.error('Admin createCodigo:', err);
    if (err.code === '23505')
      return res.status(409).json({ error: 'Ya existe un código con ese nombre.' });
    return res.status(500).json({ error: 'Error al crear código.' });
  }
};

exports.deleteCodigo = async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir eliminar un código ya canjeado
    const { data: existente } = await supabaseAdmin
      .from('codigos')
      .select('estatus')
      .eq('id', id)
      .single();

    if (existente?.estatus === 'canjeado')
      return res.status(409).json({ error: 'No se puede eliminar un código ya canjeado.' });

    await CodigoModel.delete(id);
    return res.json({ message: 'Código eliminado.' });
  } catch (err) {
    console.error('Admin deleteCodigo:', err);
    return res.status(500).json({ error: 'Error al eliminar código.' });
  }
};

// POST /admin/marketing — envío masivo de correos a todos los clientes
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
      message: `Campaña enviada: ${resultados.enviados} correos entregados, ${resultados.fallidos} fallidos.`,
      total: emails.length,
      ...resultados,
    });
  } catch (err) {
    console.error('Admin enviarMarketing:', err);
    return res.status(500).json({ error: 'Error al enviar la campaña.' });
  }
};