// AUTH-MANAGER.JS - Authentication Management System

/**
 * AuthManager - Handles user authentication and session management
 *
 * Auth model (two distinct phases):
 *
 *  PRE-SETUP  (isSetupComplete() === false)
 *    Only DEFAULT_CREDENTIALS (admin/travel2027, demo/demo123) are accepted.
 *    This gives first-time access to the setup page so a real account can be
 *    created.  No localStorage credentials are checked in this phase.
 *
 *  POST-SETUP  (isSetupComplete() === true)
 *    ONLY localStorage credentials are accepted.  The hardcoded defaults are
 *    completely ignored — no bypass possible regardless of disabled-defaults
 *    flags or credential list state.
 */
window.AuthManager = (function() {
  const STORAGE_KEY          = 'travel-portal-auth';
  const SESSION_STORAGE_KEY  = 'travel-portal-auth-session';
  const CREDENTIALS_KEY      = 'travel-portal-credentials';
  const DISABLED_DEFAULTS_KEY = 'travel-portal-disabled-defaults'; // kept for Settings UI
  const SETUP_KEY            = 'travel-portal-setup-complete';

  const DEFAULT_CREDENTIALS = [
    { username: 'admin', password: 'travel2027' },
    { username: 'demo',  password: 'demo123'    },
  ];

  // ── Session helpers ──────────────────────────────────────────────────────────

  function createSession(username, rememberMe) {
    const authData = { username, timestamp: new Date().getTime() };
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authData));
    }
    console.log('✅ Session created for:', username);
  }

  // ── Credential storage ───────────────────────────────────────────────────────

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

  function isSetupComplete() {
    return localStorage.getItem(SETUP_KEY) === 'true';
  }

  function completeSetup() {
    localStorage.setItem(SETUP_KEY, 'true');
  }

  // ── Disabled-defaults list (Settings UI only — not used in authenticate()) ───

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

  /**
   * Disable a built-in default account.
   * Post-setup this is cosmetic only (hardcode bypass is already fully disabled).
   * Still removes the account from the credentials list so it doesn't appear in Settings.
   */
  function disableDefault(username) {
    const list = getDisabledDefaults();
    if (!list.includes(username)) {
      list.push(username);
      setDisabledDefaults(list);
    }
    const credentials = loadCredentials();
    saveCredentials(credentials.filter(c => c.username !== username));
  }

  /**
   * Re-enable a built-in default account.
   * Re-adds it to the credential list with the original default password.
   * Users can then change the password via Settings if they want to keep it.
   */
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
   * Authenticate a user.
   *
   * PRE-SETUP:  only DEFAULT_CREDENTIALS accepted (bootstrap access).
   * POST-SETUP: only localStorage credentials accepted (hardcode fully disabled).
   */
  function authenticate(username, password, rememberMe = false) {
    if (!isSetupComplete()) {
      // ── Pre-setup bootstrap ──────────────────────────────────────────────────
      // Allow the factory defaults through so the owner can reach setup.html.
      const defaultMatch = DEFAULT_CREDENTIALS.find(
        c => c.username === username && c.password === password
      );
      if (defaultMatch) {
        createSession(username, rememberMe);
        return { success: true, message: 'Login successful', user: username };
      }
      return { success: false, message: 'Invalid username or password' };
    }

    // ── Post-setup: localStorage credentials only ────────────────────────────
    // DEFAULT_CREDENTIALS are completely ignored here — no bypass possible.
    const credentials = loadCredentials();
    const user = credentials.find(
      c => c.username === username && c.password === password
    );
    if (!user) {
      return { success: false, message: 'Invalid username or password' };
    }

    createSession(username, rememberMe);
    return { success: true, message: 'Login successful', user: username };
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
    isAuthenticated,
    logout,
    loadCredentials,
    saveCredentials,
    isSetupComplete,
    completeSetup,
    getDisabledDefaults,
    disableDefault,
    enableDefault,
    DEFAULT_USERNAMES: DEFAULT_CREDENTIALS.map(c => c.username),
  };
})();

console.log('✅ AuthManager module loaded');
