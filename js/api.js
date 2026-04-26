// API.JS - API integration and calls

class API {
  constructor() {
    this.claudeApiKey = localStorage.getItem(CONFIG.STORAGE_KEYS.CLAUDE_API_KEY);
    this.claudeModel = localStorage.getItem('claude_model') || CONFIG.CLAUDE.DEFAULT_MODEL;
  }

  /**
   * Call Claude API
   * @param {string} userMessage - User message
   * @param {array} conversationHistory - Previous messages
   * @returns {Promise<string>} - Claude response
   */
  async callClaude(userMessage, conversationHistory = []) {
    if (!this.claudeApiKey) {
      throw new Error('Claude API key not configured. Please add it in Settings.');
    }

    const messages = [
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await fetch(CONFIG.API.ANTHROPIC, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.claudeModel,
          max_tokens: parseInt(localStorage.getItem('max_tokens')) || CONFIG.CLAUDE.MAX_TOKENS,
          temperature: parseFloat(localStorage.getItem('temperature')) || CONFIG.CLAUDE.TEMPERATURE,
          messages: messages
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Claude API Error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

  /**
   * Test Claude API connection
   * @returns {Promise<boolean>} - Is API working
   */
  async testConnection() {
    try {
      const response = await this.callClaude('Say "Hello" in 1 word');
      return response && response.length > 0;
    } catch (error) {
      console.error('API test failed:', error);
      return false;
    }
  }

  /**
   * Get travel suggestions
   * @param {string} topic - Topic to get suggestions for
   * @param {object} tripData - Trip data context
   * @returns {Promise<string>} - Travel suggestions
   */
  async getTravelSuggestions(topic, tripData) {
    const prompt = `You are a travel expert helping plan an Italy trip from ${tripData.start_date} to ${tripData.end_date}.

Trip details:
- Route: Sydney to Rome
- Duration: ${tripData.nights} nights
- Current locations: ${tripData.sections.join(', ')}

User is asking about: ${topic}

Provide practical, actionable suggestions with specific recommendations. Keep response concise and friendly.`;

    return await this.callClaude(prompt);
  }

  /**
   * Generate activity suggestions
   * @param {string} location - Location
   * @param {string} duration - Duration
   * @returns {Promise<string>} - Activity suggestions
   */
  async generateActivities(location, duration) {
    const prompt = `Suggest 5 must-do activities in ${location}, Italy for a ${duration}. 
Format as a numbered list with brief descriptions (1-2 sentences each).
Include estimated time and cost range for each activity.`;

    return await this.callClaude(prompt);
  }

  /**
   * Find restaurants
   * @param {string} location - Location
   * @param {string} cuisine - Cuisine type
   * @returns {Promise<string>} - Restaurant recommendations
   */
  async findRestaurants(location, cuisine) {
    const prompt = `Recommend 5 best ${cuisine} restaurants in ${location}, Italy.
Format as:
Name - Type - Price Range - Must-try dish

Include tips for reservations and atmosphere.`;

    return await this.callClaude(prompt);
  }

  /**
   * Check flight options
   * @param {object} flightDetails - Flight details
   * @returns {Promise<string>} - Flight information
   */
  async checkFlights(flightDetails) {
    const prompt = `Provide flight options information for:
From: ${flightDetails.from}
To: ${flightDetails.to}
Outbound: ${flightDetails.outbound}
Return: ${flightDetails.return}

Include typical airlines, duration, price ranges, and booking tips.
Focus on popular routes for Australian travelers.`;

    return await this.callClaude(prompt);
  }

  /**
   * Get local tips
   * @param {string} location - Location
   * @returns {Promise<string>} - Local tips
   */
  async getLocalTips(location) {
    const prompt = `Provide insider tips for ${location}, Italy including:
- Best times to visit
- Local customs to know
- Hidden gems tourists miss
- Safety tips
- Transportation tips

Keep it practical and friendly.`;

    return await this.callClaude(prompt);
  }

  /**
   * Plan itinerary day
   * @param {string} location - Location
   * @param {string} duration - Duration in hours
   * @returns {Promise<string>} - Day itinerary
   */
  async planDay(location, duration) {
    const prompt = `Create a ${duration}-hour itinerary for ${location}, Italy.
Format as timeline with times, activities, and estimated duration for each stop.
Include recommendations for meals and rest.
Make it realistic and enjoyable.`;

    return await this.callClaude(prompt);
  }
}

// Global API instance
const api = new API();
