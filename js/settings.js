// SETTINGS.JS - Settings and configuration

/**
 * Initialize Settings
 */
function initSettings() {
  const settingsContainer = document.getElementById('settingsContainer');
  const isAdmin = !window.AuthManager || window.AuthManager.getCurrentUserRole() === 'admin';
  const savedModel = localStorage.getItem('claude_model') || 'claude-opus-4-7';

  settingsContainer.innerHTML = `
    <div class="settings-page">
      <div class="settings-page-title">Settings</div>

      ${!isAdmin ? `
      <div class="settings-card" style="background:#fff8e1;border-color:#ffe082;">
        <div class="settings-card-header">
          <span class="settings-card-icon">🔒</span>
          <div>
            <div class="settings-card-title">Admin Settings</div>
            <div class="settings-card-subtitle">Claude AI, Google Maps and Telegram settings are managed by your admin</div>
          </div>
        </div>
      </div>` : ''}

      <!-- CLAUDE AI — admin only -->
      <div class="settings-card" ${isAdmin ? '' : 'style="display:none;"'}>
        <div class="settings-card-header">
          <span class="settings-card-icon">🤖</span>
          <div>
            <div class="settings-card-title">Claude AI</div>
            <div class="settings-card-subtitle">Configure your API key to enable the Travel Agent</div>
          </div>
        </div>
        <div class="settings-fields-grid">
          <div class="settings-field settings-field-full">
            <label class="settings-label">
              API Key
              <span class="settings-help-tip">
                <span class="settings-help-icon">?</span>
                <span class="settings-help-bubble">
                  Need an Anthropic API key?
                  <a href="#" onclick="openFaq('faq-claude'); return false;" class="settings-help-link">See the FAQ guide →</a>
                </span>
              </span>
            </label>
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

      <!-- GOOGLE MAPS — admin only -->
      <div class="settings-card" ${isAdmin ? '' : 'style="display:none;"'}>
        <div class="settings-card-header">
          <span class="settings-card-icon">🗺️</span>
          <div>
            <div class="settings-card-title">Google Maps</div>
            <div class="settings-card-subtitle">Enable interactive maps inside section views</div>
          </div>
        </div>
        <div class="settings-fields-grid">
          <div class="settings-field settings-field-full">
            <label class="settings-label">
              API Key
              <span class="settings-help-tip" title="Need help getting a key?">
                <span class="settings-help-icon">?</span>
                <span class="settings-help-bubble">
                  Not sure how to get one?
                  <a href="#" onclick="openFaq('faq-google-maps'); return false;" class="settings-help-link">Open the FAQ guide →</a>
                </span>
              </span>
            </label>
            <input type="password" class="settings-input" id="googleMapsKey"
                   placeholder="AIza..." value="${localStorage.getItem(CONFIG.STORAGE_KEYS.GOOGLE_MAPS_KEY) || ''}">
          </div>
        </div>
        <div class="settings-actions">
          <button class="settings-btn" onclick="saveGoogleMapsConfig()">Save</button>
          <button class="settings-btn settings-btn-success" onclick="testGoogleMapsKey()">Test Key</button>
          <div id="googleMapsMessage" class="settings-msg-wrap"></div>
        </div>
      </div>

      <!-- AMADEUS FLIGHT SEARCH — admin only -->
      <div class="settings-card" ${isAdmin ? '' : 'style="display:none;"'}>
        <div class="settings-card-header">
          <span class="settings-card-icon">✈️</span>
          <div>
            <div class="settings-card-title">Amadeus Flight Search</div>
            <div class="settings-card-subtitle">In-app flight search with price alerts (free tier)</div>
          </div>
        </div>
        <div class="settings-info-box">
          <strong>Setup (free — no credit card required):</strong><br>
          1. Register at <a href="https://developers.amadeus.com/register" target="_blank" rel="noopener">developers.amadeus.com</a><br>
          2. Create a new app → copy the <strong>API Key</strong> and <strong>API Secret</strong><br>
          3. In your Vercel project → Settings → Environment Variables, add:<br>
          &nbsp;&nbsp;• <code>AMADEUS_API_KEY</code><br>
          &nbsp;&nbsp;• <code>AMADEUS_API_SECRET</code><br>
          4. Redeploy. The test environment returns realistic synthetic data.
        </div>
        <div class="settings-actions">
          <button class="settings-btn settings-btn-success" onclick="testAmadeusConnection()">Test Connection</button>
          <div id="amadeusMessage" class="settings-msg-wrap"></div>
        </div>
      </div>

      <!-- TELEGRAM — admin only -->
      <div class="settings-card" ${isAdmin ? '' : 'style="display:none;"'}>
        <div class="settings-card-header">
          <span class="settings-card-icon">✈️</span>
          <div>
            <div class="settings-card-title">Telegram Notifications</div>
            <div class="settings-card-subtitle">Get travel alerts and reminders via Telegram bot. For automatic price alerts, also add <code>TELEGRAM_BOT_TOKEN</code> and <code>TELEGRAM_CHAT_ID</code> as Vercel env vars.</div>
          </div>
        </div>
        <div class="settings-fields-grid">
          <div class="settings-field">
            <label class="settings-label">
              Bot Token
              <span class="settings-help-tip">
                <span class="settings-help-icon">?</span>
                <span class="settings-help-bubble">
                  Need to set up a Telegram bot?
                  <a href="#" onclick="openFaq('faq-telegram'); return false;" class="settings-help-link">See the FAQ guide →</a>
                </span>
              </span>
            </label>
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
          <button class="settings-btn settings-btn-info" onclick="fetchTelegramChatId()" title="Send /start to your bot first, then click this">Get Chat ID</button>
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
            <div class="settings-card-subtitle">Manage users, session and password</div>
          </div>
        </div>
        <div class="settings-auth-row">
          <div class="settings-user-info" id="currentUserDisplay"></div>
          <div class="settings-auth-btns">
            <button class="settings-btn" onclick="changePassword()">Change Password</button>
            <button class="settings-btn settings-btn-danger" onclick="logout()">Logout</button>
          </div>
        </div>
        <div id="authMessage" class="settings-msg-wrap"></div>

        <div class="settings-section-divider"></div>

        <div class="settings-subsection-title">
          Users
          <span class="settings-help-tip">
            <span class="settings-help-icon">?</span>
            <span class="settings-help-bubble">
              Accounts only sync across devices when Vercel KV is configured.
              <a href="#" onclick="openFaq('faq-vercel-kv'); return false;" class="settings-help-link">See the FAQ guide →</a>
            </span>
          </span>
        </div>
        <div id="userListContainer" class="settings-user-list"></div>

        <div id="createUserSection">
          <div class="settings-subsection-title" style="margin-top:1rem;">Create New User</div>
          <div class="settings-fields-grid">
            <div class="settings-field">
              <label class="settings-label">Username</label>
              <input type="text" class="settings-input" id="newUsername" placeholder="e.g. sarah" autocomplete="off">
            </div>
            <div class="settings-field">
              <label class="settings-label">Password</label>
              <input type="password" class="settings-input" id="newUserPassword" placeholder="Min 6 characters" autocomplete="new-password">
            </div>
          </div>
          <div class="settings-actions">
            <button class="settings-btn settings-btn-success" onclick="createUser()">Create User</button>
            <div id="userMessage" class="settings-msg-wrap"></div>
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
 * Save Google Maps config
 */
function saveGoogleMapsConfig() {
  const key = document.getElementById('googleMapsKey').value.trim();
  const msgEl = document.getElementById('googleMapsMessage');

  if (!key) {
    msgEl.innerHTML = showMessage('Please enter an API key', 'error');
    return;
  }
  if (!key.startsWith('AIza')) {
    msgEl.innerHTML = showMessage('That doesn\'t look like a valid Maps API key — it should start with "AIza"', 'error');
    return;
  }

  localStorage.setItem(CONFIG.STORAGE_KEYS.GOOGLE_MAPS_KEY, key);
  msgEl.innerHTML = showMessage('Google Maps key saved!', 'success');
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
 * Auto-detect the user's chat ID from recent bot messages via getUpdates
 */
async function fetchTelegramChatId() {
  const token = document.getElementById('telegramToken').value.trim();
  const msgEl = document.getElementById('telegramMessage');

  if (!token) {
    msgEl.innerHTML = showMessage('Enter your bot token first', 'error');
    return;
  }

  msgEl.innerHTML = showMessage('Looking for your chat ID — make sure you\'ve sent /start to your bot in Telegram first…', 'info');

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    const data = await res.json();

    if (!data.ok) {
      msgEl.innerHTML = showMessage('Token error: ' + (data.description || 'Unknown error'), 'error');
      return;
    }

    const updates = (data.result || []).slice().reverse();
    const userMsg = updates.find(u => u.message && u.message.from && !u.message.from.is_bot);

    if (userMsg) {
      const chatId = String(userMsg.message.chat.id);
      document.getElementById('telegramChatId').value = chatId;
      msgEl.innerHTML = showMessage(`✅ Chat ID found: ${chatId} — click Save then Test to confirm.`, 'success');
    } else {
      msgEl.innerHTML = showMessage('No messages found. Open Telegram, send /start to your bot, then click Get Chat ID again.', 'error');
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
 * Test Amadeus API connection by calling /api/search-flights
 */
async function testAmadeusConnection() {
  const msgEl = document.getElementById('amadeusMessage');
  msgEl.innerHTML = showMessage('Testing Amadeus connection…', 'info');

  try {
    const resp = await fetch('/api/search-flights', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'SYD', to: 'LHR', departDate: '2025-12-01', adults: 1, max: 1 })
    });
    const data = await resp.json();

    if (resp.status === 503 && data.code === 'AMADEUS_NOT_CONFIGURED') {
      msgEl.innerHTML = showMessage('Not configured — add AMADEUS_API_KEY and AMADEUS_API_SECRET to Vercel env vars, then redeploy.', 'error');
    } else if (resp.ok) {
      msgEl.innerHTML = showMessage(`✅ Connected! Found ${data.count} test result${data.count !== 1 ? 's' : ''} for SYD→LHR.`, 'success');
    } else {
      msgEl.innerHTML = showMessage('❌ ' + (data.error || 'Unknown error'), 'error');
    }
  } catch (err) {
    msgEl.innerHTML = showMessage('Connection error: ' + err.message, 'error');
  }
}

/**
 * Change password for current user
 */
async function changePassword() {
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

  const msgEl = document.getElementById('authMessage');
  msgEl.innerHTML = showMessage('Updating password…', 'info');

  // ── Try API ──────────────────────────────────────────────────────────────
  const { status, data } = await window.AuthManager.callUsersAPI('POST', {
    action: 'change-password',
    username: currentUser,
    currentPassword,
    newPassword,
  });

  if (status === 200 && data.success) {
    msgEl.innerHTML = showMessage('Password updated for "' + currentUser + '"!', 'success');
    return;
  }
  if (status === 401) {
    msgEl.innerHTML = showMessage('Current password is incorrect.', 'error');
    return;
  }
  if (status === 503 || status === 0) {
    msgEl.innerHTML = showMessage('Server unavailable — please try again shortly.', 'error');
    return;
  }

  msgEl.innerHTML = showMessage(data.error || 'Server error — please try again.', 'error');
}

/**
 * Update current user display
 */
function updateCurrentUserDisplay() {
  if (!window.AuthManager) return;

  const currentUser = window.AuthManager.getCurrentUser();
  const el = document.getElementById('currentUserDisplay');

  if (el) {
    if (currentUser) {
      el.innerHTML = '<strong>' + currentUser + '</strong><small>Session active · expires in 30 days</small>';
    } else {
      el.innerHTML = 'Not authenticated';
    }
  }

  // renderUserList is async — fire and forget
  renderUserList();
}

/**
 * Render the list of all users in the settings card.
 * Fetches from the server API; falls back to localStorage on 503.
 */
async function renderUserList() {
  const container = document.getElementById('userListContainer');
  if (!container || !window.AuthManager) return;

  container.innerHTML = '<div style="color:#888;font-size:13px;padding:0.5rem 0;">Loading users…</div>';

  const currentUser = window.AuthManager.getCurrentUser();

  const { status, data } = await window.AuthManager.callUsersAPI('GET');

  if (status !== 200 || !Array.isArray(data.users)) {
    const msg = (status === 503 || status === 0)
      ? 'Server unavailable — configure Vercel KV environment variables to manage users.'
      : (data.error || 'Could not load user list.');
    container.innerHTML = `<div style="color:#888;font-size:13px;padding:0.5rem 0;">${msg}</div>`;
    return;
  }

  const allRows = data.users;

  // Show or hide the Create User section based on whether current user is admin
  const currentUserRow  = allRows.find(u => u.username === currentUser);
  const currentUserRole = currentUserRow ? (currentUserRow.role || 'user') : 'user';
  const createSection   = document.getElementById('createUserSection');
  if (createSection) {
    createSection.style.display = currentUserRole === 'admin' ? '' : 'none';
  }

  if (allRows.length === 0) {
    container.innerHTML = '<div style="color:#888;font-size:13px;padding:0.5rem 0;">No users found.</div>';
    return;
  }

  container.innerHTML = allRows.map(u => {
    const isCurrentUser = u.username === currentUser;
    const isAdmin       = u.role === 'admin';

    let badge = '';
    if (isCurrentUser) badge += ' <span class="user-badge user-badge-you">you</span>';
    if (isAdmin)       badge += ' <span class="user-badge user-badge-builtin">admin</span>';
    if (u.createdAt) {
      const d = new Date(u.createdAt);
      badge += ' <span style="font-size:10px;color:#aaa;margin-left:4px;">joined ' + d.toLocaleDateString() + '</span>';
    }

    const actions = !isCurrentUser
      ? `<button class="settings-btn settings-btn-danger settings-btn-sm" onclick="deleteUser('${u.username}')">Delete</button>`
      : `<button class="settings-btn settings-btn-sm" disabled title="Can't delete your own account">Delete</button>`;

    return `
      <div class="user-list-row">
        <span class="user-list-name">${u.username}${badge}</span>
        <div style="display:flex;gap:6px;">${actions}</div>
      </div>`;
  }).join('');
}

/**
 * Create a new user account
 */
async function createUser() {
  const usernameEl = document.getElementById('newUsername');
  const passwordEl = document.getElementById('newUserPassword');
  const msgEl      = document.getElementById('userMessage');

  const username = usernameEl.value.trim().toLowerCase();
  const password = passwordEl.value;

  if (!username) {
    msgEl.innerHTML = showMessage('Please enter a username', 'error'); return;
  }
  if (username.length < 2) {
    msgEl.innerHTML = showMessage('Username must be at least 2 characters', 'error'); return;
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    msgEl.innerHTML = showMessage('Username can only contain letters, numbers, and underscores', 'error'); return;
  }
  if (!password || password.length < 6) {
    msgEl.innerHTML = showMessage('Password must be at least 6 characters', 'error'); return;
  }

  msgEl.innerHTML = showMessage('Creating user…', 'info');

  // ── Try API ────────────────────────────────────────────────────────────────
  const requestingUser = window.AuthManager.getCurrentUser();
  const { status, data } = await window.AuthManager.callUsersAPI('POST', {
    action: 'create', username, password, requestingUser
  });

  if (status === 200 && data.success) {
    usernameEl.value = '';
    passwordEl.value = '';
    msgEl.innerHTML  = showMessage('User "' + username + '" created successfully!', 'success');
    renderUserList();
    return;
  }
  if (status === 409) {
    msgEl.innerHTML = showMessage(data.error || 'Username "' + username + '" already exists', 'error');
    return;
  }
  if (status === 503 || status === 0) {
    msgEl.innerHTML = showMessage('Server unavailable — please configure Vercel KV environment variables.', 'error');
    return;
  }

  msgEl.innerHTML = showMessage(data.error || 'Server error — please try again.', 'error');
}

/**
 * Delete a user account
 */
async function deleteUser(username) {
  const currentUser = window.AuthManager ? window.AuthManager.getCurrentUser() : null;
  const msgEl       = document.getElementById('userMessage');

  if (username === currentUser) {
    msgEl.innerHTML = showMessage("You can't delete your own account while logged in", 'error');
    return;
  }

  if (!confirm('Delete user "' + username + '"? This cannot be undone.')) return;

  msgEl.innerHTML = showMessage('Deleting…', 'info');

  // ── Try API ────────────────────────────────────────────────────────────────
  const requestingUser = window.AuthManager.getCurrentUser();
  const { status, data } = await window.AuthManager.callUsersAPI('DELETE', { username, requestingUser });

  if (status === 200 && data.success) {
    msgEl.innerHTML = showMessage('User "' + username + '" deleted.', 'success');
    renderUserList();
    return;
  }
  if (status === 404) {
    msgEl.innerHTML = showMessage('User "' + username + '" not found on server.', 'error');
    return;
  }
  if (status === 503 || status === 0) {
    msgEl.innerHTML = showMessage('Server unavailable — please try again shortly.', 'error');
    return;
  }

  msgEl.innerHTML = showMessage(data.error || 'Server error — please try again.', 'error');
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
