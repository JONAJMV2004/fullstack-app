/**
 * auth.js — shared authentication utilities
 * Handles token storage and session management for all pages.
 */

const API_BASE = 'http://localhost:5000/api';

const Auth = (() => {
  const TOKEN_KEY = 'app_token';
  const USER_KEY  = 'app_user';

  function saveSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  }

  function isLoggedIn() {
    return !!getToken();
  }

  /**
   * Redirect to dashboard if already authenticated (call from index.html).
   */
  function redirectIfLoggedIn() {
    if (isLoggedIn()) {
      window.location.href = 'home.html';
    }
  }

  /**
   * Redirect to login if NOT authenticated (call from protected pages).
   */
  function requireAuth() {
    if (!isLoggedIn()) {
      window.location.href = 'login.html';
    }
  }

  function logout() {
    clearSession();
    window.location.href = 'index.html';
  }

  return { saveSession, clearSession, getToken, getUser, isLoggedIn, redirectIfLoggedIn, requireAuth, logout };
})();
