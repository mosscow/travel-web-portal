// STORAGE.JS - Local storage management

class Storage {
  static saveTripData(data) {
    if (data && data.id) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.TRIP_PREFIX + data.id, JSON.stringify(data));
    } else {
      localStorage.setItem(CONFIG.STORAGE_KEYS.TRIP_DATA, JSON.stringify(data));
    }
  }

  static loadTripData() {
    const activeId = Storage.getActiveTripId();
    if (activeId) {
      const data = localStorage.getItem(CONFIG.STORAGE_KEYS.TRIP_PREFIX + activeId);
      if (data) return JSON.parse(data);
    }
    const data = localStorage.getItem(CONFIG.STORAGE_KEYS.TRIP_DATA);
    return data ? JSON.parse(data) : null;
  }

  static saveTrip(trip) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.TRIP_PREFIX + trip.id, JSON.stringify(trip));
  }

  static loadTrip(id) {
    const data = localStorage.getItem(CONFIG.STORAGE_KEYS.TRIP_PREFIX + id);
    return data ? JSON.parse(data) : null;
  }

  static getTripsList() {
    const data = localStorage.getItem(CONFIG.STORAGE_KEYS.TRIPS_LIST);
    return data ? JSON.parse(data) : [];
  }

  static saveTripsList(list) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.TRIPS_LIST, JSON.stringify(list));
  }

  static getActiveTripId() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.ACTIVE_TRIP_ID);
  }

  static setActiveTripId(id) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.ACTIVE_TRIP_ID, String(id));
  }

  // Migrate legacy single-trip data to the new per-trip storage format
  static migrateLegacyData() {
    const existing = Storage.getTripsList();
    if (existing.length > 0) return null;

    const legacy = localStorage.getItem(CONFIG.STORAGE_KEYS.TRIP_DATA);
    if (!legacy) return null;

    const trip = JSON.parse(legacy);
    if (!trip.id) trip.id = Date.now();
    if (!trip.budget) {
      trip.budget = { total: 0, currency: 'AUD', categories: { accommodation: 0, flights: 0, food: 0, activities: 0, transport: 0, other: 0 } };
    }
    Storage.saveTrip(trip);
    Storage.saveTripsList([{ id: trip.id, title: trip.title, destination: trip.destination }]);
    Storage.setActiveTripId(trip.id);
    return trip;
  }

  /**
   * Save chat history
   * @param {array} messages - Chat messages
   */
  static saveChatHistory(messages) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages));
  }

  /**
   * Load chat history
   * @returns {array} - Chat messages
   */
  static loadChatHistory() {
    const data = localStorage.getItem(CONFIG.STORAGE_KEYS.CHAT_HISTORY);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Clear chat history
   */
  static clearChatHistory() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.CHAT_HISTORY);
  }

  /**
   * Export data as CSV
   * @param {object} tripData - Trip data
   * @returns {string} - CSV content
   */
  static exportToCSV(tripData) {
    let csv = 'Section,Location,Nights,Check-in,Check-out,Cost,Activities\n';
    
    tripData.sections.forEach(section => {
      const activities = section.activities ? section.activities.map(a => a.title).join('; ') : '';
      csv += `${section.id},${section.name},${section.nights},${section.startDate},${section.endDate},"${section.cost}","${activities}"\n`;
    });

    return csv;
  }

  /**
   * Export data as JSON
   * @param {object} tripData - Trip data
   * @returns {string} - JSON content
   */
  static exportToJSON(tripData) {
    return JSON.stringify(tripData, null, 2);
  }

  /**
   * Download file
   * @param {string} content - File content
   * @param {string} filename - File name
   * @param {string} type - File type
   */
  static downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Save user preference
   * @param {string} key - Preference key
   * @param {any} value - Preference value
   */
  static savePreference(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /**
   * Load user preference
   * @param {string} key - Preference key
   * @param {any} defaultValue - Default value
   * @returns {any} - Preference value
   */
  static loadPreference(key, defaultValue = null) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  }

  /**
   * Clear all data (with confirmation)
   */
  static clearAllData() {
    if (confirm('Are you sure you want to delete all trip data? This cannot be undone.')) {
      localStorage.clear();
      return true;
    }
    return false;
  }
}

// Global storage instance
const storage = new Storage();
