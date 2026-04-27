// SETTINGS.JS - Settings and configuration

/**
 * Initialize Settings
 */
function initSettings() {
  const settingsContainer = document.getElementById('settingsContainer');
  
  const savedModel = localStorage.getItem('claude_model') || 'claude-opus-4-7';

  settingsContainer.innerHTML = `
    <div class="settings-page">
      <div class="settings-page-title">Settings</div>

      <!-- CLAUDE AI -->
      <div class="settings-card">
        <div class="settings-card-header">
          <span class="settings-card-icon">🤖</span>
          <div>
            <div class="settings-card-title">Claude AI</div>
            <div class="settings-card-subtitle">Configure your API key to enable the Travel Agent</div>
          </div>
        </div>
        <div class="settings-fields-grid">
          <div class="settings-field settings-field-full">
            <label class="settings-label">API Key</label>
            <input type="password" class="settings-input" id="claudeApiKey"
                   placeholder="sk-ant-..." value="${localStorage.getItem(CONFIG.STORAGE_KEYS.CLAUDE_API_KEY) || ''}">
          </div>
          <div class="settings-field">
            <label class="settings-label">Model</label>
            <select class="settings-input" id="claudeModel">
              <option value="claude-opus-4-7"           ${savedModel === 'claude-opus-4-7'           ? 'selected' : ''}>Claude Opus 4.7 — Most Capable</option>
              <option value="claude-sonnet-4-6"         ${savedModel === 'claude-sonnet-4-6'         ? 'selected' : ''}>Claude Sonnet 4.6 — Fast & Capable</option>
              <option value="claude-haiku-4-5-20251001" ${savedModel === 'claude-haiku-4-5-20251001' ? 'selected' : ''}>Claude Haiku 4.5 — Lightweight</option>
              <option value="claude-3-5-sonnet-20241022"${savedModel === 'claude-3-5-sonnet-20241022'? 'selected' : ''}>Claude 3.5 Sonnet — Legacy</option>
            </select>
          </div>
          <div class="settings-field">
            <label class="settings-label">Max Tokens</label>
            <input type="number" class="settings-input" id="maxTokens"
                   value="${localStorage.getItem('max_tokens') || '2000'}" min="100" max="4000">
          </div>
          <div class="settings-field">
            <label class="settings-label">Temperature</label>
            <input type="number" class="settings-input" id="temperature"
                   value="${localStorage.getItem('temperature') || '0.7'}" min="0" max="1" step="0.1">
          </div>
        </div>
        <div class="settings-actions">
          <button class="settings-btn" onclick="saveClaudeConfig()">Save</button>
          <button class="settings-btn settings-btn-success" onclick="testClaudeConnection()">Test Connection</button>
          <div id="claudeMessage" class="settings-msg-wrap"></div>
        </div>
      </div>

      <!-- TELEGRAM -->
      <div class="settings-card">
        <div class="settings-card-header">
          <span class="settings-card-icon">✈️</span>
          <div>
            <div class="settings-card-title">Telegram Notifications</div>
            <div class="settings-card-subtitle">Get travel alerts and reminders via Telegram bot</div>
          </div>
        </div>
        <div class="settings-fields-grid">
          <div class="settings-field">
            <label class="settings-label">Bot Token</label>
            <input type="password" class="settings-input" id="telegramToken"
                   placeholder="123456:ABC-DEF..." value="${localStorage.getItem('telegram_token') || ''}">
          </div>
          <div class="settings-field">
            <label class="settings-label">Chat ID</label>
            <input type="text" class="settings-input" id="telegramChatId"
                   placeholder="123456789" value="${localStorage.getItem('telegram_chat_id') || ''}">
          </div>
        </div>
        <div class="settings-actions">
          <button class="settings-btn" onclick="saveTelegramConfig()">Save</button>
          <button class="settings-btn settings-btn-success" onclick="testTelegramConnection()">Test</button>
          <div id="telegramMessage" class="settings-msg-wrap"></div>
        </div>
      </div>

      <!-- ACCOUNT -->
      <div class="settings-card">
        <div class="settings-card-header">
          <span class="settings-card-icon">🔐</span>
          <div>
            <div class="settings-card-title">Account</div>
            <div class="settings-card-subtitle">Manage your session and password</div>
          </div>
        </div>
        <div class="settings-auth-row">
          <div class="settings-user-info" id="currentUserDisplay"></div>
          <div class="settings-auth-btns">
            <button class="settings-btn" onclick="changePassword()">Change Password</button>
            <button class="settings-btn settings-btn-danger" onclick="logout()">Logout</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Update user display after rendering
  updateCurrentUserDisplay();
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
    document.getElementById('claudeMessage').innerHTML = showMessage('Please enter API key', 'error');
    return;
  }

  localStorage.setItem(CONFIG.STORAGE_KEYS.CLAUDE_API_KEY, apiKey);
  localStorage.setItem('claude_model', model);
  localStorage.setItem('max_tokens', maxTokens);
  localStorage.setItem('temperature', temperature);

  document.getElementById('claudeMessage').innerHTML = showMessage('Claude configuration saved!', 'success');
}

/**
 * Test Claude API connection
 */
async function testClaudeConnection() {
  const apiKey = document.getElementById('claudeApiKey').value;

  if (!apiKey) {
    document.getElementById('claudeMessage').innerHTML = showMessage('Please enter API key first', 'error');
    return;
  }

  document.getElementById('claudeMessage').innerHTML = showMessage('Testing connection...', 'info');

  try {
    console.log('Testing API connection...');
    console.log('API Key:', apiKey.substring(0, 10) + '...');
    
    const result = await callClaudeAPI([
      {
        role: 'user',
        content: 'Say "Connection successful!" if you can read this.'
      }
    ]);

    console.log('API Result:', result);

    if (result.success) {
      document.getElementById('claudeMessage').innerHTML = showMessage('Connection successful! Claude API is ready to use.', 'success');
    } else {
      const errorMsg = typeof result.error === 'string' ? result.error : (result.error?.message || JSON.stringify(result.error));
      console.error('API Error:', errorMsg);
      document.getElementById('claudeMessage').innerHTML = showMessage('Connection failed: ' + errorMsg, 'error');
    }
  } catch (error) {
    console.error('Test error:', error);
    document.getElementById('claudeMessage').innerHTML = showMessage('Connection failed: ' + error.message, 'error');
  }
}

/**
 * Save Telegram config
 */
function saveTelegramConfig() {
  const token = document.getElementById('telegramToken').value.trim();
  const chatId = document.getElementById('telegramChatId').value.trim();

  if (!token || !chatId) {
    document.getElementById('telegramMessage').innerHTML = showMessage('Please enter both token and chat ID', 'error');
    return;
  }

  localStorage.setItem('telegram_token', token);
  localStorage.setItem('telegram_chat_id', chatId);
  document.getElementById('telegramMessage').innerHTML = showMessage('Saved. Click Test to verify connection.', 'success');
}

/**
 * Test Telegram connection — verifies token via getMe then sends a test message
 */
async function testTelegramConnection() {
  const token = document.getElementById('telegramToken').value.trim();
  const chatId = document.getElementById('telegramChatId').value.trim();
  const msgEl = document.getElementById('telegramMessage');

  if (!token || !chatId) {
    msgEl.innerHTML = showMessage('Please enter both token and chat ID first', 'error');
    return;
  }

  msgEl.innerHTML = showMessage('Testing connection...', 'info');

  try {
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meData = await meRes.json();

    if (!meData.ok) {
      msgEl.innerHTML = showMessage('Invalid token: ' + (meData.description || 'Unknown error'), 'error');
      return;
    }

    const botName = meData.result.username;

    const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `✅ Travel Portal connected!\n\nBot @${botName} is ready to send you trip updates and reminders.`
      })
    });
    const sendData = await sendRes.json();

    if (sendData.ok) {
      msgEl.innerHTML = showMessage(`✅ Connected! Test message sent via @${botName}`, 'success');
    } else {
      msgEl.innerHTML = showMessage(`Token valid but message failed: ${sendData.description}`, 'error');
    }
  } catch (err) {
    msgEl.innerHTML = showMessage('Connection error: ' + err.message, 'error');
  }
}

/**
 * Send a Telegram notification (callable from anywhere in the app)
 */
async function sendTelegramNotification(text) {
  const token = localStorage.getItem('telegram_token');
  const chatId = localStorage.getItem('telegram_chat_id');
  if (!token || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
    const data = await res.json();
    return data.ok;
  } catch (e) {
    return false;
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
  
  const currentPassword = prompt('Enter current password for "' + currentUser + '":');
  if (!currentPassword) return;

  const credentials = window.AuthManager.loadCredentials() || [];
  const userCred = credentials.find(c => c.username === currentUser);
  
  if (!userCred || userCred.password !== currentPassword) {
    alert('Current password is incorrect');
    return;
  }

  const newPassword = prompt('Enter new password for "' + currentUser + '" (min 6 characters):');
  if (!newPassword) return;
  
  if (newPassword.length < 6) {
    alert('Password must be at least 6 characters');
    return;
  }

  if (newPassword === currentPassword) {
    alert('New password must be different from current password');
    return;
  }
  
  userCred.password = newPassword;
  if (window.AuthManager.saveCredentials(credentials)) {
    document.getElementById('authMessage').innerHTML = showMessage('Password updated for "' + currentUser + '"!', 'success');
  } else {
    document.getElementById('authMessage').innerHTML = showMessage('Error updating password', 'error');
  }
}

/**
 * Update current user display
 */
function updateCurrentUserDisplay() {
  if (!window.AuthManager) {
    return;
  }
  
  const currentUser = window.AuthManager.getCurrentUser();
  const el = document.getElementById('currentUserDisplay');
  
  if (el) {
    if (currentUser) {
      el.innerHTML = '<strong>' + currentUser + '</strong><small>Session active · expires in 30 days</small>';
    } else {
      el.innerHTML = 'Not authenticated';
    }
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
      localStorage.removeItem('travel-portal-auth');
      sessionStorage.removeItem('travel-portal-auth');
      window.location.href = 'auth.html';
    }
  }
}

/**
 * Show message helper
 */
function showMessage(text, type) {
  const bgColor = type === 'success' ? '#c8e6c9' : type === 'error' ? '#ffcdd2' : '#bbdefb';
  const textColor = type === 'success' ? '#2e7d32' : type === 'error' ? '#c62828' : '#1565c0';
  
  return '<div style="background: ' + bgColor + '; color: ' + textColor + '; padding: 1rem; border-radius: 4px; font-size: 12px; font-weight: 500; margin-top: 0.5rem;">' + text + '</div>';
}

// Initialize when settings load
setTimeout(() => {
  initSettings();
}, 100);

console.log('Settings module loaded');
