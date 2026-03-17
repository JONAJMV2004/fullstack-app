Auth.requireAuth();

const token    = Auth.getToken();
const alertBox = document.getElementById('alert');

let balance    = 0;
let premioSeleccionado = null;

function showAlert(msg, type = 'error') {
  alertBox.textContent = msg;
  alertBox.className   = `ch-alert ${type}`;
}
function hideAlert() { alertBox.className = 'ch-alert hidden'; }

function authHeader() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

// ── Tabs ──
const tabs = document.querySelectorAll('.app-tab');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
    document.getElementById(`tab-${tab.dataset.tab}`).style.display = 'block';
  });
});

// ── Cargar datos ──
async function cargarDatos() {
  try {
    const [puntosRes, premiosRes] = await Promise.all([
      fetch(`${API_BASE}/lealtad/puntos`, { headers: authHeader() }),
      fetch(`${API_BASE}/lealtad/premios`, { headers: authHeader() }),
    ]);

    const puntosData  = await puntosRes.json();
    const premiosData = await premiosRes.json();

    balance = puntosData.balance || 0;

    // Mostrar balance en todas las pestañas
    document.getElementById('balance-consumibles').textContent = balance;
    document.getElementById('balance-descuentos').textContent  = balance;
    document.getElementById('balance-merch').textContent       = balance;

    const premios = premiosData.premios || [];

    // Clasificar por nombre (puedes ajustar la lógica de categorías)
    const consumibles = premios.filter(p => p.nombre.toLowerCase().includes('café') || p.nombre.toLowerCase().includes('comida') || p.nombre.toLowerCase().includes('bebida'));
    const descuentos  = premios.filter(p => p.nombre.toLowerCase().includes('descuento') || p.nombre.toLowerCase().includes('%') || (!p.nombre.toLowerCase().includes('café') && !p.nombre.toLowerCase().includes('merch')));
    const merch       = premios.filter(p => p.nombre.toLowerCase().includes('merch') || p.nombre.toLowerCase().includes('playera') || p.nombre.toLowerCase().includes('taza'));

    // Si no hay categorías definidas, mostrar todos en descuentos
    const allPremios = descuentos.length > 0 ? descuentos : premios;

    renderPremios('lista-consumibles', consumibles.length ? consumibles : premios);
    renderPremios('lista-descuentos', allPremios);
    renderPremios('lista-merch', merch.length ? merch : premios);

  } catch (err) {
    console.error(err);
    showAlert('Error al cargar los premios.');
  }
}

function renderPremios(containerId, premios) {
  const container = document.getElementById(containerId);
  if (!premios.length) {
    container.innerHTML = '<p class="empty-list">No hay premios disponibles.</p>';
    return;
  }

  container.innerHTML = premios.map(p => `
    <div class="premio-item ${balance < p.puntos_necesarios ? 'disabled' : ''}" data-id="${p.id}" data-nombre="${p.nombre}" data-puntos="${p.puntos_necesarios}">
      <div class="premio-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="#2D6A50" stroke-width="1.5" width="36" height="36">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
          <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
        </svg>
      </div>
      <div class="premio-info">
        <p class="premio-nombre">${p.nombre}</p>
        <p class="premio-desc">${p.nombre}</p>
      </div>
      <div class="premio-pts">${p.puntos_necesarios}pt</div>
    </div>
  `).join('');

  // Eventos de clic
  container.querySelectorAll('.premio-item:not(.disabled)').forEach(item => {
    item.addEventListener('click', () => abrirModal(
      parseInt(item.dataset.id),
      item.dataset.nombre,
      parseInt(item.dataset.puntos)
    ));
  });
}

// ── Modal de confirmación ──
function abrirModal(id, nombre, puntos) {
  premioSeleccionado = { id, nombre, puntos };
  document.getElementById('modal-desc').textContent =
    `¿Deseas canjear "${nombre}" por ${puntos} punto(s)? Te quedarán ${balance - puntos} puntos.`;
  document.getElementById('canje-modal').classList.remove('hidden');
}

function cerrarModal() {
  premioSeleccionado = null;
  document.getElementById('canje-modal').classList.add('hidden');
}

document.getElementById('modal-cancel').addEventListener('click', cerrarModal);

document.getElementById('modal-confirm').addEventListener('click', async () => {
  if (!premioSeleccionado) return;

  const btn = document.getElementById('modal-confirm');
  btn.querySelector('.btn-text').style.display = 'none';
  btn.querySelector('.ch-spinner').classList.remove('hidden');
  btn.disabled = true;

  try {
    const res  = await fetch(`${API_BASE}/lealtad/canjes`, {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({ premio_id: premioSeleccionado.id }),
    });
    const data = await res.json();

    cerrarModal();

    if (!res.ok) return showAlert(data.error || 'Error al realizar el canje.');

    showAlert(`¡Canje exitoso! Tu código: ${data.codigo}`, 'success');
    balance -= premioSeleccionado.puntos;
    cargarDatos();
  } catch {
    showAlert('Error de conexión.');
  } finally {
    btn.querySelector('.btn-text').style.display = '';
    btn.querySelector('.ch-spinner').classList.add('hidden');
    btn.disabled = false;
  }
});

// ── Init ──
cargarDatos();
