/**
 * app.js — login / registration page logic (index.html)
 */

// Redirect already-logged-in users
Auth.redirectIfLoggedIn();

// ─── DOM refs ──────────────────────────────────────────────────────────────
const loginForm     = document.getElementById('login-form');
const registerForm  = document.getElementById('register-form');
const alertBox      = document.getElementById('alert');
const googleBtn     = document.getElementById('google-btn');
const facebookBtn   = document.getElementById('facebook-btn');
const cardLogin     = document.getElementById('card-login');
const cardRegister  = document.getElementById('card-register');

// ─── Toggle entre login y registro ─────────────────────────────────────────
document.getElementById('show-register').addEventListener('click', () => {
  cardLogin.classList.add('hidden');
  cardRegister.classList.remove('hidden');
  hideAlert();
});

document.getElementById('show-login').addEventListener('click', () => {
  cardRegister.classList.add('hidden');
  cardLogin.classList.remove('hidden');
  hideAlert();
});

// ─── Password toggle ───────────────────────────────────────────────────────
document.querySelectorAll('.toggle-pw').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = btn.previousElementSibling;
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.setAttribute('aria-label', input.type === 'password' ? 'Show password' : 'Hide password');
  });
});

// ─── Alert helpers ─────────────────────────────────────────────────────────
function showAlert(message, type = 'error') {
  alertBox.textContent = message;
  alertBox.className = `alert ${type}`;
}

function hideAlert() {
  alertBox.className = 'alert hidden';
  alertBox.textContent = '';
}

// ─── Loading state helpers ─────────────────────────────────────────────────
function setLoading(btn, loading) {
  const text    = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.spinner');
  btn.disabled  = loading;
  text.style.display    = loading ? 'none' : '';
  spinner.classList.toggle('hidden', !loading);
}

// ─── Generic API helper ────────────────────────────────────────────────────
async function apiPost(endpoint, body) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json().then(data => ({ ok: res.ok, status: res.status, data }));
}

// ─── Login ─────────────────────────────────────────────────────────────────
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn      = document.getElementById('login-btn');

  if (!email || !password) {
    showAlert('Please fill in all fields.');
    return;
  }

  setLoading(btn, true);

  try {
    const { ok, data } = await apiPost('/auth/login', { email, password });

    if (!ok) {
      showAlert(data.error || 'Login failed. Please try again.');
      return;
    }

    Auth.saveSession(data.token, data.user);
    showAlert('Login successful! Redirecting…', 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
  } catch {
    showAlert('Network error. Please check your connection.');
  } finally {
    setLoading(btn, false);
  }
});

// ─── Register ──────────────────────────────────────────────────────────────
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();

  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const btn      = document.getElementById('register-btn');

  if (!name || !email || !password) {
    showAlert('Please fill in all fields.');
    return;
  }

  if (password.length < 6) {
    showAlert('Password must be at least 6 characters.');
    return;
  }

  setLoading(btn, true);

  try {
    const { ok, data } = await apiPost('/auth/register', { name, email, password });

    if (!ok) {
      showAlert(data.error || 'Registration failed. Please try again.');
      return;
    }

    Auth.saveSession(data.token, data.user);
    showAlert('Account created! Redirecting…', 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
  } catch {
    showAlert('Network error. Please check your connection.');
  } finally {
    setLoading(btn, false);
  }
});

// ─── Google OAuth ──────────────────────────────────────────────────────────
googleBtn.addEventListener('click', async () => {
  hideAlert();
  googleBtn.disabled = true;

  try {
    const res  = await fetch(`${API_BASE}/auth/oauth/google`);
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      showAlert('Failed to initiate Google login.');
    }
  } catch {
    showAlert('Network error. Please try again.');
  } finally {
    googleBtn.disabled = false;
  }
});

// ─── Facebook OAuth ────────────────────────────────────────────────────────
facebookBtn.addEventListener('click', async () => {
  hideAlert();
  facebookBtn.disabled = true;

  try {
    const res  = await fetch(`${API_BASE}/auth/oauth/facebook`);
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      showAlert('Failed to initiate Facebook login.');
    }
  } catch {
    showAlert('Network error. Please try again.');
  } finally {
    facebookBtn.disabled = false;
  }
});
