// CONFIG.JS - Configuration and constants

const CONFIG = {
  // App Info
  APP_NAME: 'Italy Trip 2027 - Travel Planner',
  APP_VERSION: '2.0.0',
  
  // API Endpoints
  API: {
    ANTHROPIC: 'https://api.anthropic.com/v1/messages',
    GOOGLE_MAPS: 'https://maps.googleapis.com/maps/api/js',
    SKYSCANNER: 'https://partners.api.skyscanner.com/apiservices',
  },
  
  // Claude Model Configuration
  CLAUDE: {
    DEFAULT_MODEL: 'claude-3-5-sonnet-20241022',
    MAX_TOKENS: 2000,
    TEMPERATURE: 0.7,
  },
  
  // Trip Data
  TRIP: {
    TITLE: 'Italy Trip 2027',
    DESTINATION: 'Sydney → Rome',
    START_DATE: '2027-08-01',
    END_DATE: '2027-08-28',
    NIGHTS: 32,
  },
  
  // Storage Keys
  STORAGE_KEYS: {
    CLAUDE_API_KEY: 'claude_api_key',
    GOOGLE_MAPS_KEY: 'google_maps_api_key',
    SKYSCANNER_KEY: 'skyscanner_key',
    GMAIL_EMAIL: 'gmail_email',
    TELEGRAM_TOKEN: 'telegram_token',
    TELEGRAM_CHAT_ID: 'telegram_chat_id',
    TRIP_DATA: 'trip_data',
    CHAT_HISTORY: 'chat_history',
    BOT_SETTINGS: 'bot_settings',
  },
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
