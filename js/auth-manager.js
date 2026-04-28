// AUTH-MANAGER.JS - Authentication Management System

/**
 * AuthManager - Handles user authentication and session management
 *
 * Auth model (API-only — no localStorage credential storage):
 *
 *   All credential checks go through POST /api/users { action: 'auth' }.
 *   Sessions are stored in sessionStorage (default) or localStorage (rememberMe).
 *
 *   If the API is unreachable (503 / network error) the user sees an error.
 *   There is no localStorage credential fallback.
 *
 * All public methods that touch the network return Promises.
 */
window.AuthManager = (function() {
  const STORAGE_KEY         = 'travel-portal-auth';
  const SESSION_STORAGE_KEY = 'travel-portal-auth-session';
  const SETUP_KEY           = 'travel-portal-setup-complete';

  // ── Users API helper ─────────────────────────────────────────────────────────

  /**
   * Call /api/users.
   * Returns { status, data } — never throws.
   * status 0 = network error / API not deployed.
   */
  async function callUsersAPI(method, body) {
    try {
      const opts = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (body) opts.body = JSON.stringify(body);
      const res  = await fetch('/api/users', opts);
      const data = await res.json();
      return { status: res.status, data };
    } catch (e) {
      return { status: 0, data: { error: e.message } };
    }
  }

  // ── Session helpers ──────────────────────────────────────────────────────────

  function createSession(username, rememberMe, role) {
    const authData = { username, role: role || 'user', timestamp: new Date().getTime() };
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authData));
    }
    console.log('✅ Session created for:', username, '| role:', authData.role);
  }

  // ── Setup state ──────────────────────────────────────────────────────────────

  /** Synchronous localStorage check — used as a fast cache. */
  function isSetupComplete() {
    return localStorage.getItem(SETUP_KEY) === 'true';
  }

  function completeSetup() {
    localStorage.setItem(SETUP_KEY, 'true');
  }

  /**
   * Async setup check — authoritative.
   * Returns true if the API reports at least one user exists.
   * Side-effect: caches the result in localStorage.
   */
  async function checkSetupComplete() {
    if (isSetupComplete()) return true;

    const { status, data } = await callUsersAPI('GET');
    if (status === 200 && data.users && data.users.length > 0) {
      completeSetup();
      return true;
    }
    return false;
  }

  // ── Core authentication ──────────────────────────────────────────────────────

  /**
   * Authenticate a user against the server API.
   * Returns { success, message, user?, role? }
   */
  async function authenticate(username, password, rememberMe = false) {
    const { status, data } = await callUsersAPI('POST', {
      action: 'auth', username, password
    });

    if (status === 200 && data.success) {
      completeSetup();
      createSession(username, rememberMe, data.role);
      return { success: true, message: 'Login successful', user: username, role: data.role };
    }

    if (status === 401) {
      return { success: false, message: 'Invalid username or password' };
    }

    if (status === 503 || status === 0) {
      return {
        success: false,
        message: 'Server unavailable — check that Vercel KV environment variables are configured.',
      };
    }

    return { success: false, message: data.error || 'Login failed. Please try again.' };
  }

  // ── Session queries ──────────────────────────────────────────────────────────

  function getCurrentUser() {
    try {
      const session = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (session) return JSON.parse(session).username;
    } catch (e) { /* ignore */ }
    try {
      const persistent = localStorage.getItem(STORAGE_KEY);
      if (persistent) return JSON.parse(persistent).username;
    } catch (e) { /* ignore */ }
    return null;
  }

  /**
   * Return the role stored in the current session ('admin' | 'user').
   * Defaults to 'admin' for sessions created before role-storage was added.
   */
  function getCurrentUserRole() {
    try {
      const session = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (session) return JSON.parse(session).role || 'admin';
    } catch (e) { /* ignore */ }
    try {
      const persistent = localStorage.getItem(STORAGE_KEY);
      if (persistent) return JSON.parse(persistent).role || 'admin';
    } catch (e) { /* ignore */ }
    return null;
  }

  function isAuthenticated() {
    return getCurrentUser() !== null;
  }

  function logout() {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = 'auth.html';
  }

  // ── Init ─────────────────────────────────────────────────────────────────────

  function init() {
    console.log('✅ AuthManager initialized — setup complete:', isSetupComplete());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  return {
    authenticate,
    getCurrentUser,
    getCurrentUserRole,
    isAuthenticated,
    logout,
    isSetupComplete,
    completeSetup,
    checkSetupComplete,
    callUsersAPI,
  };
})();

console.log('✅ AuthManager module loaded');
