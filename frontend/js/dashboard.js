/**
 * dashboard.js — dashboard page logic (dashboard.html)
 */

// Guard: redirect to login if no session
Auth.requireAuth();

// ─── DOM refs ──────────────────────────────────────────────────────────────
const alertBox        = document.getElementById('alert');
const navGreeting     = document.getElementById('nav-greeting');
const profileAvatar   = document.getElementById('profile-avatar');
const avatarFallback  = document.getElementById('avatar-fallback');
const profileName     = document.getElementById('profile-name');
const profileEmail    = document.getElementById('profile-email');
const profileProvider = document.getElementById('profile-provider');
const editForm        = document.getElementById('edit-form');
const editNameInput   = document.getElementById('edit-name');
const editPasswordInput = document.getElementById('edit-password');
const passwordSection = document.getElementById('password-section');
const saveBtn         = document.getElementById('save-btn');
const logoutBtn       = document.getElementById('logout-btn');
const deleteBtn       = document.getElementById('delete-btn');
const deleteModal     = document.getElementById('delete-modal');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

// ─── State ─────────────────────────────────────────────────────────────────
let currentUser = null;

// ─── Alert helpers ─────────────────────────────────────────────────────────
function showAlert(message, type = 'error') {
  alertBox.textContent = message;
  alertBox.className = `alert ${type}`;
  alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideAlert() {
  alertBox.className = 'alert hidden';
}

// ─── Loading state ─────────────────────────────────────────────────────────
function setLoading(btn, loading) {
  const text    = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.spinner');
  btn.disabled  = loading;
  if (text)    text.style.display    = loading ? 'none' : '';
  if (spinner) spinner.classList.toggle('hidden', !loading);
}

// ─── Auth headers ──────────────────────────────────────────────────────────
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${Auth.getToken()}`,
  };
}

// ─── Render profile ────────────────────────────────────────────────────────
function renderProfile(user) {
  currentUser = user;

  navGreeting.textContent  = `Hello, ${user.name.split(' ')[0]}`;
  profileName.textContent  = user.name;
  profileEmail.textContent = user.email;
  profileProvider.textContent = user.provider || 'local';

  // Avatar
  if (user.avatar_url) {
    profileAvatar.src = user.avatar_url;
    profileAvatar.classList.remove('hidden');
    avatarFallback.classList.add('hidden');
  } else {
    profileAvatar.classList.add('hidden');
    avatarFallback.classList.remove('hidden');
    avatarFallback.textContent = user.name.charAt(0).toUpperCase();
  }

  // Pre-fill edit form
  editNameInput.value = user.name;

  // Hide password field for OAuth users (they don't have passwords)
  if (user.provider !== 'local') {
    passwordSection.style.display = 'none';
  }
}

// ─── Load profile from backend ─────────────────────────────────────────────
async function loadProfile() {
  try {
    const res  = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
    const data = await res.json();

    if (res.status === 401 || res.status === 403) {
      Auth.logout();
      return;
    }

    if (!res.ok) throw new Error(data.error);

    renderProfile(data.user);
  } catch (err) {
    showAlert(`Failed to load profile: ${err.message}`);
  }
}

// ─── Save profile changes ──────────────────────────────────────────────────
editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();

  const name     = editNameInput.value.trim();
  const password = editPasswordInput.value;
  const body     = {};

  if (!name) {
    showAlert('Name cannot be empty.');
    return;
  }

  if (name !== currentUser.name) body.name = name;
  if (password)                  body.password = password;

  if (Object.keys(body).length === 0) {
    showAlert('No changes to save.', 'success');
    return;
  }

  if (password && password.length < 6) {
    showAlert('Password must be at least 6 characters.');
    return;
  }

  setLoading(saveBtn, true);

  try {
    const res = await fetch(`${API_BASE}/users/${currentUser.id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      showAlert(data.error || 'Failed to update profile.');
      return;
    }

    // Update stored user and re-render
    Auth.saveSession(Auth.getToken(), { ...Auth.getUser(), name: data.user.name });
    renderProfile(data.user);
    editPasswordInput.value = '';
    showAlert('Profile updated successfully.', 'success');
  } catch {
    showAlert('Network error. Please try again.');
  } finally {
    setLoading(saveBtn, false);
  }
});

// ─── Password visibility toggle ────────────────────────────────────────────
document.querySelectorAll('.toggle-pw').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = btn.previousElementSibling;
    input.type = input.type === 'password' ? 'text' : 'password';
  });
});

// ─── Logout ────────────────────────────────────────────────────────────────
logoutBtn.addEventListener('click', () => Auth.logout());

// ─── Delete account modal ──────────────────────────────────────────────────
deleteBtn.addEventListener('click', () => {
  deleteModal.classList.remove('hidden');
});

cancelDeleteBtn.addEventListener('click', () => {
  deleteModal.classList.add('hidden');
});

// Close modal when clicking backdrop
deleteModal.addEventListener('click', (e) => {
  if (e.target === deleteModal) deleteModal.classList.add('hidden');
});

confirmDeleteBtn.addEventListener('click', async () => {
  setLoading(confirmDeleteBtn, true);

  try {
    const res = await fetch(`${API_BASE}/users/${currentUser.id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = await res.json();

    if (!res.ok) {
      deleteModal.classList.add('hidden');
      showAlert(data.error || 'Failed to delete account.');
      return;
    }

    Auth.clearSession();
    window.location.href = 'index.html';
  } catch {
    deleteModal.classList.add('hidden');
    showAlert('Network error. Please try again.');
  } finally {
    setLoading(confirmDeleteBtn, false);
  }
});

// ─── Init ──────────────────────────────────────────────────────────────────
loadProfile();
