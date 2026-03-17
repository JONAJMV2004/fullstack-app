Auth.requireAuth();

const token    = Auth.getToken();

function authHeader() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

function pad(num, size) {
  return String(num).padStart(size, '0');
}

async function cargarHome() {
  try {
    const [meRes, puntosRes] = await Promise.all([
      fetch(`${API_BASE}/auth/me`, { headers: authHeader() }),
      fetch(`${API_BASE}/lealtad/puntos`, { headers: authHeader() }),
    ]);

    const meData     = await meRes.json();
    const puntosData = await puntosRes.json();

    const usuario = meData.user;
    const balance = puntosData.balance || 0;
    const membresia = pad(usuario.id, 4);
    const numTarjeta = pad(usuario.id, 8);

    document.getElementById('user-nombre').textContent    = usuario.nombre || usuario.name || '—';
    document.getElementById('user-membresia').textContent = membresia;
    document.getElementById('tarjeta-numero').textContent = numTarjeta;
    document.getElementById('tarjeta-pts').textContent    = `${balance} PUNTOS`;

    // Generar QR con el número de tarjeta
    new QRCode(document.getElementById('qr-code'), {
      text: `CIELITO-${numTarjeta}`,
      width: 90,
      height: 90,
      colorDark: '#ffffff',
      colorLight: '#2D6A50',
      correctLevel: QRCode.CorrectLevel.M,
    });

  } catch (err) {
    console.error('Error cargando home:', err);
  }
}

cargarHome();
