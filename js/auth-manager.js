// AUTH-MANAGER.JS - Authentication Management System

/**
 * AuthManager - Handles user authentication and session management
 */
window.AuthManager = (function() {
  const STORAGE_KEY = 'travel-portal-auth';
  const SESSION_STORAGE_KEY = 'travel-portal-auth-session';
  const CREDENTIALS_KEY = 'travel-portal-credentials';
  const DISABLED_DEFAULTS_KEY = 'travel-portal-disabled-defaults';
  const DEFAULT_CREDENTIALS = [
    { username: 'admin', password: 'travel2027' },
    { username: 'demo', password: 'demo123' }
  ];

  /**
   * Get the list of disabled default usernames
   */
  function getDisabledDefaults() {
    try {
      const data = localStorage.getItem(DISABLED_DEFAULTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Save the list of disabled default usernames
   */
  function setDisabledDefaults(list) {
    try {
      localStorage.setItem(DISABLED_DEFAULTS_KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Disable a built-in default account (hardcode bypass will be skipped)
   */
  function disableDefault(username) {
    const list = getDisabledDefaults();
    if (!list.includes(username)) {
      list.push(username);
      setDisabledDefaults(list);
    }
    // Also remove from stored credentials so they don't appear in the list
    const credentials = loadCredentials();
    const updated = credentials.filter(c => c.username !== username);
    saveCredentials(updated);
  }

  /**
   * Re-enable a built-in default account (restores hardcode bypass + re-adds to credential list)
   */
  function enableDefault(username) {
    const list = getDisabledDefaults().filter(u => u !== username);
    setDisabledDefaults(list);
    // Re-add to credential list with the original default password
    const original = DEFAULT_CREDENTIALS.find(c => c.username === username);
    if (original) {
      const credentials = loadCredentials();
      if (!credentials.find(c => c.username === username)) {
        credentials.push({ username: original.username, password: original.password });
        saveCredentials(credentials);
      }
    }
  }

  /**
   * Initialize credentials if not exists
   */
  function initializeCredentials() {
    const existing = localStorage.getItem(CREDENTIALS_KEY);
    if (!existing) {
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(DEFAULT_CREDENTIALS));
    }
  }

  /**
   * Load credentials from storage
   */
  function loadCredentials() {
    try {
      initializeCredentials();
      const data = localStorage.getItem(CREDENTIALS_KEY);
      return data ? JSON.parse(data) : DEFAULT_CREDENTIALS;
    } catch (e) {
      console.error('Error loading credentials:', e);
      return DEFAULT_CREDENTIALS;
    }
  }

  /**
   * Save credentials to storage
   */
  function saveCredentials(credentials) {
    try {
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
      return true;
    } catch (e) {
      console.error('Error saving credentials:', e);
      return false;
    }
  }

  /**
   * Authenticate user
   */
  function authenticate(username, password, rememberMe = false) {
    const disabledDefaults = getDisabledDefaults();
    // Check hardcoded defaults only if not disabled
    const defaultMatch = DEFAULT_CREDENTIALS.find(
      c => c.username === username && c.password === password && !disabledDefaults.includes(c.username)
    );
    if (!defaultMatch) {
      const credentials = loadCredentials();
      const user = credentials.find(c => c.username === username && c.password === password);
      if (!user) {
        return { success: false, message: 'Invalid username or password' };
      }
    }

    const authData = {
      username: username,
      timestamp: new Date().getTime()
    };

    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authData));
    }

    console.log('User authenticated:', username);
    return { success: true, message: 'Login successful', user: username };
  }

  /**
   * Get current user
   */
  function getCurrentUser() {
    // Check sessionStorage first (highest priority)
    const sessionAuth = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionAuth) {
      try {
        return JSON.parse(sessionAuth).username;
      } catch (e) {
        console.error('Error parsing session auth:', e);
      }
    }

    // Check localStorage
    const persistentAuth = localStorage.getItem(STORAGE_KEY);
    if (persistentAuth) {
      try {
        return JSON.parse(persistentAuth).username;
      } catch (e) {
        console.error('Error parsing persistent auth:', e);
      }
    }

    return null;
  }

  /**
   * Check if user is authenticated
   */
  function isAuthenticated() {
    return getCurrentUser() !== null;
  }

  /**
   * Logout current user
   */
  function logout() {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = 'auth.html';
  }

  /**
   * Initialize - just load credentials, NO redirects!
   */
  function init() {
    initializeCredentials();
    console.log('✅ AuthManager initialized');
  }

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  return {
    authenticate: authenticate,
    getCurrentUser: getCurrentUser,
    isAuthenticated: isAuthenticated,
    logout: logout,
    loadCredentials: loadCredentials,
    saveCredentials: saveCredentials,
    getDisabledDefaults: getDisabledDefaults,
    disableDefault: disableDefault,
    enableDefault: enableDefault,
    DEFAULT_USERNAMES: DEFAULT_CREDENTIALS.map(c => c.username),
    init: init
  };
})();

console.log('✅ AuthManager module loaded - NO automatic redirects');
