// AUTH-MANAGER.JS - Authentication Management System

/**
 * AuthManager - Handles user authentication and session management
 */
window.AuthManager = (function() {
  const STORAGE_KEY = 'travel-portal-auth';
  const SESSION_STORAGE_KEY = 'travel-portal-auth-session';
  const CREDENTIALS_KEY = 'travel-portal-credentials';
  const DISABLED_DEFAULTS_KEY = 'travel-portal-disabled-defaults';
  const SETUP_KEY = 'travel-portal-setup-complete';
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
    const credentials = loadCredentials();
    const storedUser = credentials.find(c => c.username === username);

    // Hardcode bypass applies ONLY if ALL of these are true:
    //  1. Username matches a DEFAULT_CREDENTIALS entry
    //  2. Password matches the ORIGINAL default password
    //  3. The account has NOT been explicitly disabled
    //  4. The password has NOT been changed in localStorage (i.e. the stored
    //     password still matches the factory default — user hasn't taken ownership)
    const defaultCred = DEFAULT_CREDENTIALS.find(c => c.username === username);
    const passwordCustomised = storedUser && defaultCred && storedUser.password !== defaultCred.password;

    const defaultMatch = defaultCred &&
      defaultCred.password === password &&
      !disabledDefaults.includes(username) &&
      !passwordCustomised;

    if (!defaultMatch) {
      // Fall through to localStorage credentials only
      if (!storedUser || storedUser.password !== password) {
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
   * Check whether the first-run setup has been completed
   */
  function isSetupComplete() {
    return localStorage.getItem(SETUP_KEY) === 'true';
  }

  /**
   * Mark first-run setup as complete
   */
  function completeSetup() {
    localStorage.setItem(SETUP_KEY, 'true');
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
    isSetupComplete: isSetupComplete,
    completeSetup: completeSetup,
    DEFAULT_USERNAMES: DEFAULT_CREDENTIALS.map(c => c.username),
    init: init
  };
})();

console.log('✅ AuthManager module loaded - NO automatic redirects');
