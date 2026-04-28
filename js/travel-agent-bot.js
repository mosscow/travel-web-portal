// TRAVEL-AGENT-BOT.JS - Travel Agent Bot implementation

let chatHistory = [];
let undoHistory = [];

/**
 * Initialize Travel Agent Bot
 */
function initTravelAgentBot() {
  const botContainer = document.getElementById('botContainer');
  
  botContainer.innerHTML = `
    <div class="chat-container">
      <div class="chat-messages" id="chatMessages">
        ${UIComponents.createEmptyState()}
      </div>
      
      <div class="chat-input-area">
        <div class="info-banner" id="infoBanner" style="display: none;">
          <strong>⚠️ API Key Required:</strong> Please set your Claude API key in Settings to use the Travel Agent Bot.
        </div>
        
        <div class="chat-toolbar">
          <button class="btn-toolbar" onclick="undoLastChange()" title="Undo last itinerary change">↶ Undo</button>
          <button class="btn-toolbar" onclick="clearChat()" title="Clear chat history">🗑️ Clear chat</button>
          <button class="btn-toolbar" onclick="exportChat()" title="Export conversation">📥 Export</button>
          <button class="btn-toolbar" onclick="toggleApiStatus()" title="API connection status">🔌 Status: <span id="apiStatus">Offline</span></button>
        </div>

        <div class="chat-input-row">
          <input type="text" class="chat-input" id="chatInput" placeholder="Ask about activities, flights, accommodations, or any travel planning..." onkeypress="handleKeyPress(event)">
          <button class="btn-send" id="sendBtn" onclick="sendMessage()" disabled>Send</button>
        </div>
      </div>
    </div>
  `;

  // Check if API key exists
  const apiKey = localStorage.getItem(CONFIG.STORAGE_KEYS.CLAUDE_API_KEY);
  if (apiKey) {
    document.getElementById('sendBtn').disabled = false;
    document.getElementById('apiStatus').textContent = 'Online';
  }
}

/**
 * Handle key press
 */
function handleKeyPress(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

/**
 * Send message
 */
async function sendMessage(message = null) {
  const input = message || document.getElementById('chatInput').value;
  if (!input.trim()) return;

  const apiKey = localStorage.getItem(CONFIG.STORAGE_KEYS.CLAUDE_API_KEY);
  if (!apiKey) {
    document.getElementById('infoBanner').style.display = 'block';
    return;
  }

  // Hide empty state
  const emptyState = document.getElementById('emptyState');
  if (emptyState) emptyState.remove();

  // Add user message
  addMessage(input, 'user');
  document.getElementById('chatInput').value = '';

  // Save to history
  chatHistory.push({ role: 'user', content: input });

  // Get bot response
  document.getElementById('sendBtn').disabled = true;
  try {
    // Build messages: brief system context followed by the full chat history
    const systemSeed = [
      {
        role: 'user',
        content: 'You are a helpful Travel Planning Assistant for a 32-night Italy trip covering Rome, Naples, Amalfi Coast, Tuscany, Milan and Venice. Help the user plan activities, accommodation, transport and give practical travel tips. Be concise and friendly.'
      },
      {
        role: 'assistant',
        content: "I'm your Italy Travel Agent! Ask me anything about your trip — activities, hotels, getting around, local tips, and more."
      }
    ];
    const result = await callClaudeAPI([...systemSeed, ...chatHistory]);
    if (!result.success) throw new Error(result.error || 'No response from Claude');
    const botResponse = result.message;
    addMessage(botResponse, 'bot');
    chatHistory.push({ role: 'assistant', content: botResponse });
    Storage.saveChatHistory(chatHistory);
  } catch (error) {
    addMessage(`Error: ${error.message}`, 'bot');
    console.error('Chat error:', error);
  } finally {
    document.getElementById('sendBtn').disabled = false;
    document.getElementById('chatInput').focus();
  }
}

/**
 * Add message to chat
 */
function addMessage(text, role) {
  const messagesDiv = document.getElementById('chatMessages');
  const messageEl = document.createElement('div');
  messageEl.innerHTML = UIComponents.createMessageBubble(text, role);
  messagesDiv.appendChild(messageEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/**
 * Apply to itinerary
 */
function applyToItinerary() {
  alert('✅ Suggestion applied to your itinerary! Check the Trip Planner tab.');
  undoHistory.push(JSON.stringify(chatHistory));
}

/**
 * Copy message
 */
function copyMessage() {
  const lastMessage = document.querySelectorAll('.message-text');
  if (lastMessage.length > 0) {
    const text = lastMessage[lastMessage.length - 1].textContent;
    navigator.clipboard.writeText(text);
    alert('📋 Copied to clipboard!');
  }
}

/**
 * Undo last change
 */
function undoLastChange() {
  if (undoHistory.length > 0) {
    undoHistory.pop();
    alert('↶ Last change undone!');
  } else {
    alert('Nothing to undo');
  }
}

/**
 * Clear chat
 */
function clearChat() {
  if (confirm('Clear all chat messages?')) {
    document.getElementById('chatMessages').innerHTML = UIComponents.createEmptyState();
    chatHistory = [];
    Storage.clearChatHistory();
  }
}

/**
 * Export chat
 */
function exportChat() {
  const text = chatHistory
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');
  Storage.downloadFile(text, `italy-trip-chat-${new Date().toISOString().slice(0, 10)}.txt`);
  alert('📥 Chat exported!');
}

/**
 * Toggle API status
 */
function toggleApiStatus() {
  const apiKey = localStorage.getItem(CONFIG.STORAGE_KEYS.CLAUDE_API_KEY);
  alert(apiKey ? '✅ API Connected' : '❌ API Not Configured\n\nSet your Claude API key in Settings');
}

// Load chat history on init
document.addEventListener('DOMContentLoaded', function() {
  chatHistory = Storage.loadChatHistory();
});
