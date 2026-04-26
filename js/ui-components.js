// UI-COMPONENTS.JS - Reusable UI components

class UIComponents {
  /**
   * Create header
   */
  static createHeader() {
    return `
      <div class="global-header">
        <div class="trip-title">${CONFIG.TRIP.TITLE}</div>
        <div class="trip-meta">
          <span>📍 ${CONFIG.TRIP.DESTINATION}</span>
          <span>📅 Aug 1–28, 2027</span>
          <span>🗓️ ${CONFIG.TRIP.NIGHTS} nights</span>
        </div>
        <div class="header-tabs" id="headerTabs">
          <button class="header-tab-btn active" onclick="switchHeaderTab(0)">Trip planner</button>
          <button class="header-tab-btn" onclick="switchHeaderTab(1)">🤖 Travel agent bot</button>
          <button class="header-tab-btn" onclick="switchHeaderTab(2)">⚙️ Settings</button>
        </div>
      </div>
    `;
  }

  /**
   * Create summary card
   */
  static createSummaryCard(section, index) {
    return `
      <div class="summary-card" id="card-${section.id}" onclick="selectSegment(${section.id}, ${index + 1})">
        <div class="summary-number">${index + 1}</div>
        <div class="summary-dest">${section.name}</div>
        <div class="summary-days">${section.nights} nights</div>
        <div class="summary-highlights">${section.highlights}</div>
      </div>
    `;
  }

  /**
   * Create info stat
   */
  static createInfoStat(label, value) {
    return `
      <div class="info-stat">
        <div class="info-label">${label}</div>
        <div class="info-value">${value}</div>
      </div>
    `;
  }

  /**
   * Create activity card
   */
  static createActivityCard(activity, index) {
    return `
      <div class="activity-card">
        <div class="activity-time-row">
          <span class="time-label">🕐 Time</span>
          <input type="time" class="activity-time-input" value="${activity.time}" onchange="updateActivity(${index}, 'time', this.value)">
          <button class="btn-small" onclick="removeActivity(${index})">×</button>
        </div>
        
        <div class="activity-field">
          <label class="field-label">Title</label>
          <input type="text" class="activity-title-input" value="${activity.title}" placeholder="Activity title" onchange="updateActivity(${index}, 'title', this.value)">
        </div>
        
        <div class="activity-field">
          <label class="field-label">Notes</label>
          <textarea class="activity-notes-input" placeholder="Notes about this activity" onchange="updateActivity(${index}, 'notes', this.value)">${activity.notes}</textarea>
        </div>
        
        <div class="activity-field">
          <label class="field-label">Location</label>
          <input type="text" class="activity-search" placeholder="🔍 Search location on Google Maps" onchange="searchMapLocation(${index}, this.value)">
        </div>
        
        <div class="activity-actions">
          <button class="btn-map-link" onclick="goToMap(${index})">📍 View on map</button>
        </div>
      </div>
    `;
  }

  /**
   * Create message bubble
   */
  static createMessageBubble(message, role = 'user') {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const avatar = role === 'user' ? '👤' : '🤖';
    const actions = role === 'bot' ? `
      <div class="message-actions">
        <button class="btn-action" onclick="applyToItinerary()">✅ Apply to itinerary</button>
        <button class="btn-action" onclick="copyMessage()">📋 Copy</button>
      </div>
    ` : '';

    return `
      <div class="chat-message message-${role}">
        <div class="message-avatar ${role}">${avatar}</div>
        <div class="message-content">
          <div class="message-text">${this.escapeHtml(message)}</div>
          <div class="message-timestamp">${timestamp}</div>
          ${actions}
        </div>
      </div>
    `;
  }

  /**
   * Create empty state
   */
  static createEmptyState() {
    return `
      <div class="empty-state" id="emptyState">
        <div class="empty-state-icon">🤖</div>
        <div class="empty-state-text">Travel Agent Bot</div>
        <div class="empty-state-desc">Chat with Claude AI to plan activities, book flights, update your itinerary, and get personalized travel recommendations for your Italy trip.</div>
        <div class="suggestion-chips">
          <div class="chip" onclick="sendMessage('Help me plan activities for Rome')">📍 Plan Rome activities</div>
          <div class="chip" onclick="sendMessage('What are good restaurants near Amalfi Coast?')">🍽️ Restaurant recommendations</div>
          <div class="chip" onclick="sendMessage('Check flight prices from Sydney to Rome')">✈️ Check flight prices</div>
        </div>
      </div>
    `;
  }

  /**
   * Create settings section
   */
  static createSettingsSection(title, icon, content) {
    return `
      <div class="settings-section">
        <div class="section-header">${icon} ${title}</div>
        ${content}
      </div>
    `;
  }

  /**
   * Create config field
   */
  static createConfigField(label, inputHtml, description = '') {
    return `
      <div class="config-field">
        <label class="config-label">${label}</label>
        ${inputHtml}
        ${description ? `<div class="config-desc">${description}</div>` : ''}
      </div>
    `;
  }

  /**
   * Escape HTML
   */
  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show message
   */
  static showMessage(message, type = 'success') {
    const className = type === 'success' ? 'success-msg' : 'error-msg';
    return `<div class="${className}">${message}</div>`;
  }
}
