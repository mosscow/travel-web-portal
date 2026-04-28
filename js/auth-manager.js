// AUTH-MANAGER.JS - Authentication Management System

/**
 * AuthManager - Handles user authentication and session management
 *
 * Auth model (two distinct phases):
 *
 *  PRE-SETUP  (checkSetupComplete() resolves false)
 *    If the API is reachable and has zero users → show setup.html.
 *    If the API is unreachable (503) and localStorage has no setup flag →
 *    only DEFAULT_CREDENTIALS (admin/travel2027, demo/demo123) are accepted
 *    as a bootstrap path so the owner can reach setup.html.
 *
 *  POST-SETUP  (checkSetupComplete() resolves true)
 *    The API is the authoritative credential store.
 *    If the API is unreachable (503), localStorage credentials are used as
 *    a local fallback — the hardcoded defaults are never accepted in this
 *    phase regardless of the fallback path.
 *
 * All public methods that touch the network return Promises.
 * Legacy callers that used the old synchronous authenticate() must now await.
 */
window.AuthManager = (function() {
  const STORAGE_KEY           = 'travel-portal-auth';
  const SESSION_STORAGE_KEY   = 'travel-portal-auth-session';
  const CREDENTIALS_KEY       = 'travel-portal-credentials';
  const DISABLED_DEFAULTS_KEY = 'travel-portal-disabled-defaults';
  const SETUP_KEY             = 'travel-portal-setup-complete';

  const DEFAULT_CREDENTIALS = [
    { username: 'admin', password: 'travel2027' },
    { username: 'demo',  password: 'demo123'    },
  ];

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
    const authData = { username, role: role || 'admin', timestamp: new Date().getTime() };
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authData));
    }
    console.log('✅ Session created for:', username, '| role:', authData.role);
  }

  // ── Credential storage (localStorage fallback) ────────────────────────────────

  function loadCredentials() {
    try {
      const data = localStorage.getItem(CREDENTIALS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading credentials:', e);
      return [];
    }
  }

  function saveCredentials(credentials) {
    try {
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
      return true;
    } catch (e) {
      console.error('Error saving credentials:', e);
      return false;
    }
  }

  // ── Setup state ──────────────────────────────────────────────────────────────

  /** Synchronous localStorage check — use as a fast cache only. */
  function isSetupComplete() {
    return localStorage.getItem(SETUP_KEY) === 'true';
  }

  function completeSetup() {
    localStorage.setItem(SETUP_KEY, 'true');
  }

  /**
   * Async setup check — authoritative.
   * Returns true if:
   *   (a) localStorage already has the flag, OR
   *   (b) the API reports at least one user exists.
   *
   * Side-effect: caches the result in localStorage so subsequent
   * synchronous isSetupComplete() calls return the right answer.
   */
  async function checkSetupComplete() {
    if (isSetupComplete()) return true;

    const { status, data } = await callUsersAPI('GET');
    if (status === 200 && data.users && data.users.length > 0) {
      completeSetup(); // cache for this device
      return true;
    }
    return false;
  }

  // ── Disabled-defaults list (Settings UI only) ────────────────────────────────

  function getDisabledDefaults() {
    try {
      const data = localStorage.getItem(DISABLED_DEFAULTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function setDisabledDefaults(list) {
    try {
      localStorage.setItem(DISABLED_DEFAULTS_KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  function disableDefault(username) {
    const list = getDisabledDefaults();
    if (!list.includes(username)) {
      list.push(username);
      setDisabledDefaults(list);
    }
    const credentials = loadCredentials();
    saveCredentials(credentials.filter(c => c.username !== username));
  }

  function enableDefault(username) {
    setDisabledDefaults(getDisabledDefaults().filter(u => u !== username));
    const original = DEFAULT_CREDENTIALS.find(c => c.username === username);
    if (original) {
      const credentials = loadCredentials();
      if (!credentials.find(c => c.username === username)) {
        credentials.push({ username: original.username, password: original.password });
        saveCredentials(credentials);
      }
    }
  }

  // ── Core authentication ──────────────────────────────────────────────────────

  /**
   * Authenticate a user.  Always returns a Promise.
   *
   * Strategy:
   *   1. Try POST /api/users { action: 'auth' }
   *      • 200 success  → create session, return success
   *      • 401          → credentials wrong, return failure
   *      • 503 / 0      → KV not configured, fall through to localStorage
   *   2. localStorage fallback:
   *      • Pre-setup    → only DEFAULT_CREDENTIALS accepted (bootstrap access)
   *      • Post-setup   → only localStorage credentials accepted
   */
  async function authenticate(username, password, rememberMe = false) {
    // ── 1. Try API ───────────────────────────────────────────────────────────
    const { status, data } = await callUsersAPI('POST', {
      action: 'auth', username, password
    });

    if (status === 200 && data.success) {
      completeSetup(); // ensure device-local flag is set
      createSession(username, rememberMe, data.role);
      return { success: true, message: 'Login successful', user: username, role: data.role };
    }

    if (status === 401) {
      return { success: false, message: 'Invalid username or password' };
    }

    // ── 2. API unavailable (503 or network error) — local fallback ───────────
    console.warn('Users API unavailable (status', status, ') — falling back to localStorage auth');

    if (!isSetupComplete()) {
      // Pre-setup bootstrap: allow factory defaults through
      const defaultMatch = DEFAULT_CREDENTIALS.find(
        c => c.username === username && c.password === password
      );
      if (defaultMatch) {
        createSession(username, rememberMe, 'admin'); // bootstrap defaults are always admin
        return { success: true, message: 'Login successful', user: username, role: 'admin' };
      }
      return { success: false, message: 'Invalid username or password' };
    }

    // Post-setup local fallback: localStorage credentials only
    const credentials = loadCredentials();
    const user = credentials.find(
      c => c.username === username && c.password === password
    );
    if (!user) {
      return { success: false, message: 'Invalid username or password' };
    }
    createSession(username, rememberMe, 'admin'); // localStorage fallback — treat as admin (no role info)
    return { success: true, message: 'Login successful', user: username, role: 'admin' };
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
   * Defaults to 'admin' for sessions created before role-storage was added
   * (backward-compatible — existing users keep full access).
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
    // Auth
    authenticate,
    getCurrentUser,
    getCurrentUserRole,
    isAuthenticated,
    logout,
    // Setup state
    isSetupComplete,
    completeSetup,
    checkSetupComplete,
    // API access (used by settings.js and setup.html)
    callUsersAPI,
    // Local-storage credential management (fallback / offline)
    loadCredentials,
    saveCredentials,
    // Built-in default account helpers
    getDisabledDefaults,
    disableDefault,
    enableDefault,
    DEFAULT_USERNAMES: DEFAULT_CREDENTIALS.map(c => c.username),
  };
})();

console.log('✅ AuthManager module loaded');
