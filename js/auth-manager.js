// AUTH-MANAGER.JS - Authentication Management System

/**
 * AuthManager - Handles user authentication and session management
 */
window.AuthManager = (function() {
  const STORAGE_KEY = 'travel-portal-auth';
  const SESSION_STORAGE_KEY = 'travel-portal-auth-session';
  const CREDENTIALS_KEY = 'travel-portal-credentials';
  const DEFAULT_CREDENTIALS = [
    { username: 'admin', password: 'travel2027' },
    { username: 'demo', password: 'demo123' }
  ];

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
    const credentials = loadCredentials();
    const user = credentials.find(c => c.username === username && c.password === password);

    if (!user) {
      return { success: false, message: 'Invalid username or password' };
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
    init: init
  };
})();

console.log('✅ AuthManager module loaded - NO automatic redirects');
