// STORAGE.JS - Local storage management

class Storage {
  /**
   * Save trip data
   * @param {object} data - Trip data
   */
  static saveTripData(data) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.TRIP_DATA, JSON.stringify(data));
  }

  /**
   * Load trip data
   * @returns {object} - Trip data
   */
  static loadTripData() {
    const data = localStorage.getItem(CONFIG.STORAGE_KEYS.TRIP_DATA);
    return data ? JSON.parse(data) : null;
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
