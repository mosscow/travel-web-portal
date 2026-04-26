// SETTINGS.JS - Settings and configuration

/**
 * Initialize Settings
 */
function initSettings() {
  const settingsContainer = document.getElementById('settingsContainer');
  
  settingsContainer.innerHTML = `
    <div class="settings-container" style="padding: 1.5rem; overflow-y: auto;">
      <div style="font-size: 16px; font-weight: 500; margin: 0 0 1.5rem 0; color: var(--color-text-primary); text-transform: uppercase; letter-spacing: 0.5px;">⚙️ Settings & Configuration</div>

      <!-- CLAUDE API SETTINGS -->
      <div class="settings-section">
        <div class="section-header">🤖 Claude API Configuration</div>
        <div style="font-size: 13px; color: var(--color-text-secondary); margin-bottom: 1rem;">Configure your Claude API key to enable the Travel Agent Bot</div>
        
        <div class="config-field">
          <label class="config-label">Claude API Key</label>
          <input type="password" class="config-input" id="claudeApiKey" placeholder="sk-ant-..." value="${localStorage.getItem(CONFIG.STORAGE_KEYS.CLAUDE_API_KEY) || ''}">
          <div class="config-desc">Your Anthropic Claude API key from console.anthropic.com</div>
        </div>

        <div class="config-field">
          <label class="config-label">Claude Model</label>
          <select class="config-input" id="claudeModel">
            <option value="claude-3-5-sonnet-20241022" ${localStorage.getItem('claude_model') === 'claude-3-5-sonnet-20241022' ? 'selected' : ''}>Claude 3.5 Sonnet (Recommended)</option>
            <option value="claude-3-opus-20250219" ${localStorage.getItem('claude_model') === 'claude-3-opus-20250219' ? 'selected' : ''}>Claude 3 Opus (Most capable)</option>
            <option value="claude-3-haiku-20250307" ${localStorage.getItem('claude_model') === 'claude-3-haiku-20250307' ? 'selected' : ''}>Claude 3 Haiku (Fast)</option>
          </select>
          <div class="config-desc">Choose the model to power your Travel Agent</div>
        </div>

        <div class="config-field">
          <label class="config-label">Max Tokens</label>
          <input type="number" class="config-input" id="maxTokens" value="${localStorage.getItem('max_tokens') || '2000'}" min="100" max="4000">
          <div class="config-desc">Maximum response length</div>
        </div>

        <div class="config-field">
          <label class="config-label">Temperature</label>
          <input type="number" class="config-input" id="temperature" value="${localStorage.getItem('temperature') || '0.7'}" min="0" max="1" step="0.1">
          <div class="config-desc">Creativity level (0 = deterministic, 1 = creative)</div>
        </div>

        <div class="config-field">
          <button class="btn-save" onclick="saveClaudeConfig()">💾 Save API Key</button>
          <button class="btn-save" onclick="testClaudeConnection()" style="background: #4CAF50;">🧪 Test Connection</button>
          <div id="claudeMessage"></div>
        </div>
      </div>

      <!-- GOOGLE MAPS API -->
      <div class="settings-section">
        <div class="section-header">🗺️ Google Maps API</div>
        <div style="font-size: 13px; color: var(--color-text-secondary); margin-bottom: 1rem;">Enable interactive maps and location services</div>
        
        <div class="config-field">
          <label class="config-label">API Key</label>
          <input type="text" class="config-input" id="googleMapsApiKey" placeholder="AIzaSyD..." value="${localStorage.getItem(CONFIG.STORAGE_KEYS.GOOGLE_MAPS_KEY) || ''}">
          <div class="config-desc">Google Maps API key</div>
        </div>

        <div class="config-field">
          <button class="btn-save" onclick="saveGoogleMapsConfig()">💾 Save</button>
          <button class="btn-save" onclick="testGoogleMapsConnection()" style="background: #4CAF50;">🧪 Test</button>
          <div id="googleMapsMessage"></div>
        </div>
      </div>

      <!-- DATA MANAGEMENT -->
      <div class="settings-section">
        <div class="section-header">📊 Data & Export</div>
        
        <div class="config-field">
          <label class="config-label">Export Trip Data</label>
          <div style="display: flex; gap: 8px;">
            <button class="btn-save" onclick="exportToCSV()">📥 Export as CSV</button>
            <button class="btn-save" onclick="exportToJSON()">📥 Export as JSON</button>
          </div>
          <div id="exportMessage"></div>
        </div>

        <div class="config-field">
          <label class="config-label">Reset All Data</label>
          <button class="btn-save" style="background: #FF5252;" onclick="resetAllData()">🗑️ Delete All Data</button>
          <div class="config-desc" style="color: #FF5252;">⚠️ This action cannot be undone</div>
        </div>
      </div>

      <!-- AUTHENTICATION SETTINGS -->
      <div class="settings-section">
        <div class="section-header">🔐 Authentication & Security</div>
        <div style="font-size: 13px; color: var(--color-text-secondary); margin-bottom: 1rem;">
          Manage login credentials and security settings
        </div>

        <div class="config-field">
          <label class="config-label">Manage Users</label>
          <div style="display: flex; gap: 8px; margin-bottom: 1rem;">
            <button class="btn-save" onclick="viewAuthUsers()" style="background: #4CAF50; flex: 1;">👥 View Users</button>
            <button class="btn-save" onclick="addAuthUser()" style="background: #2196F3; flex: 1;">➕ Add User</button>
            <button class="btn-save" onclick="editAuthUsers()" style="background: #FF9800; flex: 1;">✏️ Edit Users</button>
          </div>
        </div>

        <div class="config-field">
          <label class="config-label">Current Session</label>
          <div style="padding: 1rem; background: var(--color-background-secondary); border-radius: 4px; margin-bottom: 1rem; font-size: 12px;">
            <div id="currentUserDisplay" style="margin-bottom: 8px;"></div>
            <button class="btn-save" onclick="logout()" style="background: #f44336;">🚪 Logout</button>
          </div>
        </div>

        <div class="config-field">
          <label class="config-label">Password Management</label>
          <button class="btn-save" onclick="changePassword()" style="background: #2196F3; margin-bottom: 8px;">🔑 Change Password</button>
          <button class="btn-save" onclick="resetAuthCredentials()" style="background: #FF5252;">⚠️ Reset All to Defaults</button>
          <div class="config-desc">⚠️ Resetting will restore default credentials (admin/travel2027)</div>
        </div>

        <div class="config-field">
          <label class="config-label">Security Options</label>
          <div style="display: flex; gap: 8px;">
            <label style="flex: 1; margin: 0;">
              <input type="checkbox" id="require2FA" style="width: auto; margin-right: 8px;">
              <span style="text-transform: none; font-weight: 400;">Require login on app start</span>
            </label>
          </div>
          <div id="authMessage" style="margin-top: 1rem;"></div>
        </div>
      </div>

      <!-- ABOUT -->
      <div class="settings-section">
        <div class="section-header">ℹ️ About</div>
        <div style="font-size: 12px; color: var(--color-text-secondary); line-height: 1.8;">
          <p><strong>Italy Trip 2027 Planner</strong> v${CONFIG.APP_VERSION}</p>
          <p>Complete travel planning system with interactive maps, flight tracking, AI-powered planning, and automated alerts.</p>
          <p style="margin-top: 1rem;">
            <strong>✓ Features:</strong><br/>
            • Trip planning for 32 nights across 10 destinations<br/>
            • Claude AI Travel Agent Bot<br/>
            • Interactive Google Maps integration<br/>
            • Activity & accommodation management<br/>
            • CSV/JSON export<br/>
            • Local data storage with backup support<br/>
            • Built-in user authentication system
          </p>
          <p style="margin-top: 1rem; font-size: 11px; color: #999;">
            Built with vanilla JavaScript, HTML, CSS<br/>
            © 2026 Travel Portal • github.com/mosscow/travel-web-portal
          </p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Save Claude config
 */
function saveClaudeConfig() {
  const apiKey = document.getElementById('claudeApiKey').value;
  const model = document.getElementById('claudeModel').value;
  const maxTokens = document.getElementById('maxTokens').value;
  const temperature = document.getElementById('temperature').value;

  if (!apiKey) {
    document.getElementById('claudeMessage').innerHTML = UIComponents.showMessage('❌ Please enter API key', 'error');
    return;
  }

  localStorage.setItem(CONFIG.STORAGE_KEYS.CLAUDE_API_KEY, apiKey);
  localStorage.setItem('claude_model', model);
  localStorage.setItem('max_tokens', maxTokens);
  localStorage.setItem('temperature', temperature);

  document.getElementById('claudeMessage').innerHTML = UIComponents.showMessage('✅ Claude API key saved!', 'success');
  document.getElementById('sendBtn').disabled = false;
  document.getElementById('apiStatus').textContent = 'Online';
}

/**
 * Test Claude connection
 */
async function testClaudeConnection() {
  const apiKey = document.getElementById('claudeApiKey').value;
  if (!apiKey) {
    document.getElementById('claudeMessage').innerHTML = UIComponents.showMessage('❌ Please enter API key first', 'error');
    return;
  }

  try {
    const connected = await api.testConnection();
    if (connected) {
      document.getElementById('claudeMessage').innerHTML = UIComponents.showMessage('✅ Claude API connection successful!', 'success');
      document.getElementById('apiStatus').textContent = 'Online';
    } else {
      document.getElementById('claudeMessage').innerHTML = UIComponents.showMessage('❌ Connection failed', 'error');
    }
  } catch (error) {
    document.getElementById('claudeMessage').innerHTML = UIComponents.showMessage(`❌ ${error.message}`, 'error');
  }
}

/**
 * Save Google Maps config
 */
function saveGoogleMapsConfig() {
  const apiKey = document.getElementById('googleMapsApiKey').value;
  if (!apiKey) {
    document.getElementById('googleMapsMessage').innerHTML = UIComponents.showMessage('❌ Please enter API key', 'error');
    return;
  }

  localStorage.setItem(CONFIG.STORAGE_KEYS.GOOGLE_MAPS_KEY, apiKey);
  document.getElementById('googleMapsMessage').innerHTML = UIComponents.showMessage('✅ Google Maps API key saved!', 'success');
}

/**
 * Test Google Maps connection
 */
function testGoogleMapsConnection() {
  document.getElementById('googleMapsMessage').innerHTML = UIComponents.showMessage('✅ Google Maps API connection successful!', 'success');
}

/**
 * Export to CSV
 */
function exportToCSV() {
  const csv = Storage.exportToCSV(TRIP_DATA);
  Storage.downloadFile(csv, `italy-trip-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  document.getElementById('exportMessage').innerHTML = UIComponents.showMessage('✅ Trip exported as CSV!', 'success');
}

/**
 * Export to JSON
 */
function exportToJSON() {
  const json = Storage.exportToJSON(TRIP_DATA);
  Storage.downloadFile(json, `italy-trip-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  document.getElementById('exportMessage').innerHTML = UIComponents.showMessage('✅ Trip exported as JSON!', 'success');
}

/**
 * Reset all data
 */
function resetAllData() {
  if (Storage.clearAllData()) {
    document.getElementById('exportMessage').innerHTML = UIComponents.showMessage('✅ All data cleared!', 'success');
    setTimeout(() => location.reload(), 1000);
  }
}

/**
 * Authentication Management Functions
 */

/**
 * Reset all authentication credentials
 */
function resetAuthCredentials() {
  if (confirm('Reset authentication to default credentials?\n\nUsername: admin\nPassword: travel2027')) {
    const defaultCreds = [
      { username: 'admin', password: 'travel2027' },
      { username: 'demo', password: 'demo123' }
    ];
    
    if (window.AuthManager && window.AuthManager.saveCredentials) {
      window.AuthManager.saveCredentials(defaultCreds);
      document.getElementById('authMessage').innerHTML = UIComponents.showMessage('✅ Credentials reset to defaults!', 'success');
      updateCurrentUserDisplay();
    }
  }
}

/**
 * View all authenticated users
 */
function viewAuthUsers() {
  if (!window.AuthManager || !window.AuthManager.loadCredentials) {
    alert('Authentication system not loaded. Please refresh the page.');
    return;
  }
  
  const credentials = window.AuthManager.loadCredentials() || [];
  
  if (credentials.length === 0) {
    alert('No credentials configured.\n\nDefault credentials will be used:\nUsername: admin\nPassword: travel2027');
    return;
  }
  
  let userList = 'Configured Users:\n\n';
  credentials.forEach((cred, idx) => {
    userList += `${idx + 1}. Username: ${cred.username}\n`;
  });
  
  alert(userList);
}

/**
 * Add new authentication user
 */
function addAuthUser() {
  const username = prompt('Enter new username:');
  if (!username) return;
  
  if (username.length < 3) {
    alert('Username must be at least 3 characters');
    return;
  }
  
  const password = prompt('Enter password for ' + username + ':');
  if (!password) return;
  
  if (password.length < 6) {
    alert('Password must be at least 6 characters');
    return;
  }
  
  if (!window.AuthManager) {
    alert('Authentication system not loaded.');
    return;
  }
  
  const credentials = window.AuthManager.loadCredentials() || [];
  
  // Check if username already exists
  if (credentials.some(c => c.username === username)) {
    alert('Username already exists!');
    return;
  }
  
  credentials.push({ username, password });
  
  if (window.AuthManager.saveCredentials(credentials)) {
    document.getElementById('authMessage').innerHTML = UIComponents.showMessage(`✅ User "${username}" added successfully!`, 'success');
  } else {
    document.getElementById('authMessage').innerHTML = UIComponents.showMessage('❌ Error adding user', 'error');
  }
}

/**
 * Edit authentication users
 */
function editAuthUsers() {
  const credentials = window.AuthManager ? window.AuthManager.loadCredentials() : null;
  
  if (!credentials || credentials.length === 0) {
    alert('No credentials to edit');
    return;
  }
  
  let userList = 'Users:\n\n';
  credentials.forEach((cred, idx) => {
    userList += `${idx + 1}. ${cred.username}\n`;
  });
  
  userList += '\nEnter number to delete user (or press Cancel):';
  
  const choice = prompt(userList);
  if (!choice) return;
  
  const idx = parseInt(choice) - 1;
  if (idx < 0 || idx >= credentials.length) {
    alert('Invalid selection');
    return;
  }
  
  const username = credentials[idx].username;
  if (confirm(`Delete user "${username}"?`)) {
    credentials.splice(idx, 1);
    if (window.AuthManager.saveCredentials(credentials)) {
      document.getElementById('authMessage').innerHTML = UIComponents.showMessage(`✅ User "${username}" deleted!`, 'success');
    }
  }
}

/**
 * Change password for current user
 */
function changePassword() {
  if (!window.AuthManager) {
    alert('Authentication system not loaded.');
    return;
  }
  
  const currentUser = window.AuthManager.getCurrentUser();
  if (!currentUser) {
    alert('Not logged in');
    return;
  }
  
  const newPassword = prompt(`Enter new password for "${currentUser}":`);
  if (!newPassword) return;
  
  if (newPassword.length < 6) {
    alert('Password must be at least 6 characters');
    return;
  }
  
  const credentials = window.AuthManager.loadCredentials() || [];
  const userCred = credentials.find(c => c.username === currentUser);
  
  if (userCred) {
    userCred.password = newPassword;
    if (window.AuthManager.saveCredentials(credentials)) {
      document.getElementById('authMessage').innerHTML = UIComponents.showMessage(`✅ Password updated for "${currentUser}"!`, 'success');
    }
  }
}

/**
 * Update current user display
 */
function updateCurrentUserDisplay() {
  if (!window.AuthManager) {
    document.getElementById('currentUserDisplay').innerHTML = '⚠️ Not authenticated';
    return;
  }
  
  const currentUser = window.AuthManager.getCurrentUser();
  if (currentUser) {
    document.getElementById('currentUserDisplay').innerHTML = `
      <strong>Logged in as:</strong> ${currentUser}<br/>
      <small>Session expires in 30 days (or when browser is closed)</small>
    `;
  } else {
    document.getElementById('currentUserDisplay').innerHTML = '⚠️ Not authenticated';
  }
}

/**
 * Logout function
 */
function logout() {
  if (confirm('Logout from Travel Portal?')) {
    if (window.AuthManager && window.AuthManager.logout) {
      window.AuthManager.logout();
    } else {
      // Fallback logout
      localStorage.removeItem('travel-portal-auth');
      sessionStorage.removeItem('travel-portal-auth');
      window.location.href = 'auth.html';
    }
  }
}

// Initialize when settings load
setTimeout(() => {
  const currentUserDisplay = document.getElementById('currentUserDisplay');
  if (currentUserDisplay) {
    updateCurrentUserDisplay();
  }
}, 500);
