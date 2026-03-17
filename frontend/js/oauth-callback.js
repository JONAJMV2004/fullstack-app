/**
 * oauth-callback.js — handles the Supabase OAuth redirect (oauth-callback.html)
 *
 * After Google/Facebook login, Supabase redirects to this page with:
 *   #access_token=...&refresh_token=...&...
 * We extract those tokens, exchange them with our backend for an app JWT,
 * then store the session and redirect to the dashboard.
 */

(async () => {
  const statusMsg = document.getElementById('status-msg');

  // Parse hash fragment: #access_token=...&token_type=...&...
  const hash   = window.location.hash.substring(1);
  const params = Object.fromEntries(new URLSearchParams(hash));

  const { access_token, refresh_token } = params;

  if (!access_token) {
    statusMsg.textContent = 'Authentication failed. No token received.';
    setTimeout(() => { window.location.href = 'index.html'; }, 2500);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/oauth/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token, refresh_token }),
    });

    const data = await res.json();

    if (!res.ok) {
      statusMsg.textContent = data.error || 'Authentication failed.';
      setTimeout(() => { window.location.href = 'index.html'; }, 2500);
      return;
    }

    Auth.saveSession(data.token, data.user);
    statusMsg.textContent = 'Success! Redirecting to dashboard…';
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
  } catch {
    statusMsg.textContent = 'Network error. Please try again.';
    setTimeout(() => { window.location.href = 'index.html'; }, 2500);
  }
})();
