// UI-COMPONENTS.JS - Reusable UI components

class UIComponents {
  /**
   * Create header
   */
  static createHeader() {
    return `
      <div class="global-header">
        <div class="header-title-block">
          <div class="trip-title" id="headerTripTitle">${CONFIG.TRIP.TITLE} OVERVIEW</div>
          <div class="trip-instruction" id="headerInstruction">CLICK SECTION TILE BELOW TO EDIT SECTION</div>
        </div>
        <div class="header-tabs" id="headerTabs">
          <button class="header-tab-btn active" onclick="switchHeaderTab(0)">✈️ Trip Planner</button>
          <button class="header-tab-btn" onclick="switchHeaderTab(1)">🤖 Travel Agent</button>
          <button class="header-tab-btn" onclick="switchHeaderTab(2)">⚙️ Settings</button>
          <button class="header-tab-btn" onclick="switchHeaderTab(3)">❓ FAQ</button>
        </div>
      </div>
    `;
  }

  static formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /**
   * Create summary card
   */
  static createSummaryCard(section, index) {
    const activityCount = section.activities ? section.activities.length : 0;
    const badge = activityCount > 0
      ? `<div class="summary-activity-badge">${activityCount} ${activityCount === 1 ? 'activity' : 'activities'}</div>`
      : '';
    const nights = calcNights(section.startDate, section.endDate);
    const nightsLabel = nights > 0 ? `${nights} night${nights === 1 ? '' : 's'}` : '— nights';
    const arrival   = UIComponents.formatDate(section.startDate);
    const departure = UIComponents.formatDate(section.endDate);
    return `
      <div class="summary-card" id="card-${section.id}" onclick="selectSegment(${section.id}, ${index + 1})">
        <div class="summary-number">${index + 1}</div>
        <div class="summary-dest">${section.name}</div>
        <div class="summary-date-row">
          <span class="summary-date-label">Arrival</span>
          <span class="summary-date-value">${arrival}</span>
        </div>
        <div class="summary-date-row">
          <span class="summary-date-label">Departure</span>
          <span class="summary-date-value">${departure}</span>
        </div>
        <div class="summary-nights">${nightsLabel}</div>
        ${badge}
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
  static createActivityCard(activity, index, itemNumber) {
    const priority = activity.priority || 1;
    const num = itemNumber || 1;

    // Support both old durationValue/durationUnit and new durationHrs/durationMins
    let durationHrs, durationMins;
    if (activity.durationHrs !== undefined || activity.durationMins !== undefined) {
      durationHrs = activity.durationHrs || 0;
      durationMins = activity.durationMins || 0;
    } else if (activity.durationValue) {
      if (activity.durationUnit === 'hrs') {
        durationHrs = activity.durationValue; durationMins = 0;
      } else {
        durationHrs = Math.floor(activity.durationValue / 60);
        durationMins = activity.durationValue % 60;
      }
    } else {
      durationHrs = 1; durationMins = 0;
    }

    const priorityOptions = [1, 2, 3, 4, 5].map(p =>
      `<option value="${p}" ${priority === p ? 'selected' : ''}>${p}</option>`
    ).join('');

    return `
      <div class="activity-card">

        <div class="activity-title-row">
          <span class="activity-item-num">${num}</span>
          <span class="activity-title-label">TITLE</span>
          <input type="text" class="activity-title-input" value="${activity.title}"
                 placeholder="Activity title" onchange="updateActivity(${index}, 'title', this.value)">
          <button class="btn-remove-activity" onclick="removeActivity(${index})">×</button>
        </div>

        <div class="activity-meta-row">
          <div class="activity-meta-group">
            <span class="meta-label">🕐 TIME</span>
            <input type="time" class="activity-time-input" value="${activity.time}"
                   onchange="updateActivity(${index}, 'time', this.value)">
          </div>
          <div class="activity-meta-group">
            <span class="meta-label">⏱ DURATION</span>
            <div class="duration-hm-group">
              <input type="number" class="activity-dur-num" value="${durationHrs}" min="0" max="23"
                     placeholder="0" onchange="updateActivity(${index}, 'durationHrs', parseInt(this.value)||0)">
              <span class="dur-unit-label">HRS</span>
              <input type="number" class="activity-dur-num" value="${durationMins}" min="0" max="59"
                     placeholder="0" onchange="updateActivity(${index}, 'durationMins', parseInt(this.value)||0)">
              <span class="dur-unit-label">MINS</span>
            </div>
          </div>
          <div class="activity-meta-group">
            <span class="meta-label">★ PRIORITY</span>
            <select class="activity-priority-select" onchange="updatePriority(${index}, parseInt(this.value))">
              ${priorityOptions}
            </select>
          </div>
        </div>

        <div class="activity-field">
          <label class="field-label">Notes</label>
          <textarea class="activity-notes-input" placeholder="Notes about this activity"
                    onchange="updateActivity(${index}, 'notes', this.value)">${activity.notes}</textarea>
        </div>

        <div class="activity-field">
          <label class="field-label">Location</label>
          <div class="location-search-wrap">
            <input type="text"
                   id="loc-input-activity-${index}"
                   class="activity-search"
                   placeholder="🔍 Search location on Google Maps"
                   value="${this.escapeHtml(activity.location || '')}"
                   oninput="locationSearchInput(this,'activity',${index})"
                   onblur="closeLocationDropdown('loc-drop-activity-${index}')">
            <div class="location-dropdown" id="loc-drop-activity-${index}"></div>
          </div>
        </div>

        <div class="activity-actions">
          <button class="btn-map-link" onclick="goToMap('activity',${index})">📍 View on map</button>
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
