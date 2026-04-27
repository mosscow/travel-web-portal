// API.JS - Claude API Integration with Vercel Proxy

/**
 * Call Claude API through Vercel proxy (bypasses CORS)
 */
async function callClaudeAPI(messages, options = {}) {
  const apiKey = localStorage.getItem(CONFIG.STORAGE_KEYS.CLAUDE_API_KEY);
  
  if (!apiKey) {
    return {
      success: false,
      error: 'Claude API key not configured. Please set it in Settings.',
      errorCode: 'NO_API_KEY'
    };
  }

  const model = localStorage.getItem('claude_model') || 'claude-4-20250514';
  const maxTokens = localStorage.getItem('max_tokens') || '2000';
  const temperature = localStorage.getItem('temperature') || '0.7';

  try {
    // Call through Vercel API proxy (no CORS issues!)
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages,
        model: model,
        max_tokens: maxTokens,
        temperature: temperature,
        apiKey: apiKey // Proxy will use this to call Claude
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Claude API request failed',
        errorCode: data.error?.type || 'API_ERROR',
        details: data
      };
    }

    // Extract the response text
    if (data.content && data.content.length > 0) {
      const textContent = data.content.find(block => block.type === 'text');
      if (textContent) {
        return {
          success: true,
          message: textContent.text,
          usage: data.usage,
          model: data.model
        };
      }
    }

    return {
      success: false,
      error: 'No text content in API response',
      errorCode: 'INVALID_RESPONSE'
    };
  } catch (error) {
    console.error('Claude API Error:', error);
    return {
      success: false,
      error: error.message || 'Network error calling Claude API',
      errorCode: 'NETWORK_ERROR'
    };
  }
}

/**
 * Test Claude API connection
 */
async function testClaudeConnection() {
  const testMessage = [
    {
      role: 'user',
      content: 'Say "Connection successful!" if you can read this.'
    }
  ];

  const result = await callClaudeAPI(testMessage);
  return result;
}

/**
 * Send message to Claude Travel Agent
 */
async function sendTravelAgentMessage(userMessage) {
  // Get conversation history
  const history = getTravelAgentHistory() || [];

  // Build messages array
  const messages = [
    {
      role: 'user',
      content: `You are a helpful Travel Planning Assistant for an Italy trip. You provide recommendations for activities, accommodations, transportation, and travel tips. Current context: 32-night Italy trip covering Rome, Naples, Amalfi, Tuscany, Milan, Venice. Help the user plan their trip!\n\nUser: ${userMessage}`
    }
  ];

  // Call API
  const result = await callClaudeAPI(messages);

  if (result.success) {
    // Save to history
    saveTravelAgentMessage({
      role: 'user',
      content: userMessage
    });
    saveTravelAgentMessage({
      role: 'assistant',
      content: result.message
    });
  }

  return result;
}

/**
 * Get Travel Agent chat history
 */
function getTravelAgentHistory() {
  try {
    const history = localStorage.getItem('travel_agent_history');
    return history ? JSON.parse(history) : [];
  } catch (e) {
    console.error('Error loading chat history:', e);
    return [];
  }
}

/**
 * Save Travel Agent message to history
 */
function saveTravelAgentMessage(message) {
  try {
    const history = getTravelAgentHistory();
    history.push({
      ...message,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 messages to avoid storage limits
    if (history.length > 50) {
      history.shift();
    }
    
    localStorage.setItem('travel_agent_history', JSON.stringify(history));
  } catch (e) {
    console.error('Error saving chat message:', e);
  }
}

/**
 * Clear chat history
 */
function clearTravelAgentHistory() {
  localStorage.removeItem('travel_agent_history');
}

console.log('✅ API module loaded with Vercel proxy support');
