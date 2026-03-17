const API_BASE = 'http://localhost:5000/api';
const token = Auth.getToken();
const alertBox = document.getElementById('alert');

function showAlert(msg, type = 'error') {
  alertBox.textContent = msg;
  alertBox.className = `ch-alert ${type}`;
}

document.getElementById('btn-idioma').addEventListener('click', () => {
  showAlert('Cambio de idioma próximamente disponible.');
});

document.getElementById('btn-reportar').addEventListener('click', () => {
  window.location.href = 'soporte.html';
});

document.getElementById('btn-tema').addEventListener('click', () => {
  showAlert('Cambio de tema próximamente disponible.');
});

document.getElementById('btn-eliminar').addEventListener('click', () => {
  document.getElementById('delete-modal').classList.remove('hidden');
});

document.getElementById('modal-cancel').addEventListener('click', () => {
  document.getElementById('delete-modal').classList.add('hidden');
});

document.getElementById('modal-confirm').addEventListener('click', async () => {
  const btn = document.getElementById('modal-confirm');
  btn.querySelector('.btn-text').style.display = 'none';
  btn.querySelector('.ch-spinner').classList.remove('hidden');
  btn.disabled = true;

  try {
    const user = Auth.getUser();
    const res = await fetch(`${API_BASE}/users/${user.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!res.ok) {
      const data = await res.json();
      showAlert(data.error || 'Error al eliminar cuenta.');
      document.getElementById('delete-modal').classList.add('hidden');
      return;
    }

    Auth.clearSession();
    window.location.href = 'index.html';
  } catch {
    showAlert('Error de conexión.');
  } finally {
    btn.querySelector('.btn-text').style.display = '';
    btn.querySelector('.ch-spinner').classList.add('hidden');
    btn.disabled = false;
  }
});
