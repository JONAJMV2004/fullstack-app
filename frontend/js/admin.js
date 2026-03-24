/**
 * admin.js — utilidades compartidas del panel de administración
 */
const API_ADMIN = 'http://localhost:5000/api/admin';
const API_AUTH  = 'http://localhost:5000/api/auth';

const AdminAuth = (() => {
  const TOKEN_KEY = 'app_token';
  const USER_KEY  = 'app_user';

  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function getUser()  {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); }
    catch { return null; }
  }

  function requireAdmin() {
    const token = getToken();
    const user  = getUser();
    if (!token || !user) {
      window.location.href = 'login.html';
      return false;
    }
    if (user.tipo_usuario !== 'admin') {
      window.location.href = 'home.html';
      return false;
    }
    return true;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = 'login.html';
  }

  return { getToken, getUser, requireAdmin, logout };
})();

function adminHeader() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AdminAuth.getToken()}`,
  };
}

function showAdminAlert(el, msg, type = 'error') {
  el.textContent = msg;
  el.className = `admin-alert show ${type}`;
}

function hideAdminAlert(el) {
  el.className = 'admin-alert';
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Marcar nav item activo
(function markActiveNav() {
  const page = window.location.pathname.split('/').pop();
  document.querySelectorAll('.admin-nav a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });
})();

// Mostrar nombre del admin en topbar
(function setAdminName() {
  const user = AdminAuth.getUser();
  const el = document.getElementById('admin-user-name');
  if (el && user) el.textContent = user.nombre || user.name || 'Admin';
})();

// Logout btn
document.getElementById('admin-logout')?.addEventListener('click', (e) => {
  e.preventDefault();
  AdminAuth.logout();
});
