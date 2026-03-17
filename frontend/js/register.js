Auth.redirectIfLoggedIn();

const alertBox = document.getElementById('alert');

function showAlert(msg, type = 'error') {
  alertBox.textContent = msg;
  alertBox.className = `ch-alert ${type}`;
}
function hideAlert() { alertBox.className = 'ch-alert hidden'; }

function setLoading(btn, loading) {
  btn.querySelector('.btn-text').style.display = loading ? 'none' : '';
  btn.querySelector('.ch-spinner').classList.toggle('hidden', !loading);
  btn.disabled = loading;
}

// ── Toggle contraseña ──
document.querySelectorAll('.ch-eye-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    input.type = input.type === 'password' ? 'text' : 'password';
  });
});

// ── Registro ──
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();

  const nombre   = document.getElementById('reg-nombre').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm  = document.getElementById('reg-confirm').value;
  const terms    = document.getElementById('reg-terms').checked;
  const btn      = document.getElementById('register-btn');

  if (!nombre || !email || !password) return showAlert('Completa todos los campos.');
  if (password.length < 6) return showAlert('La contraseña debe tener al menos 6 caracteres.');
  if (password !== confirm) return showAlert('Las contraseñas no coinciden.');
  if (!terms) return showAlert('Debes aceptar los Términos y Política de privacidad.');

  setLoading(btn, true);
  try {
    const res  = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password }),
    });
    const data = await res.json();

    if (!res.ok) return showAlert(data.error || 'Error al crear cuenta.');

    Auth.saveSession(data.token, data.user);
    showAlert('Cuenta creada exitosamente.', 'success');
    setTimeout(() => { window.location.href = 'home.html'; }, 800);
  } catch {
    showAlert('Error de conexión. Verifica que el servidor esté activo.');
  } finally {
    setLoading(btn, false);
  }
});

// ── Google ──
document.getElementById('google-btn').addEventListener('click', async () => {
  try {
    const res  = await fetch(`${API_BASE}/auth/oauth/google`);
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else showAlert('No se pudo iniciar Google login.');
  } catch { showAlert('Error de conexión.'); }
});

// ── Facebook ──
document.getElementById('facebook-btn').addEventListener('click', async () => {
  try {
    const res  = await fetch(`${API_BASE}/auth/oauth/facebook`);
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else showAlert('No se pudo iniciar Facebook login.');
  } catch { showAlert('Error de conexión.'); }
});

// ── Apple (placeholder) ──
document.getElementById('apple-btn').addEventListener('click', () => {
  showAlert('Login con Apple próximamente disponible.');
});
