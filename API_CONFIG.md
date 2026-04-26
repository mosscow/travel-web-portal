# API Configuration Guide

This guide explains how to set up all the APIs used in the Travel Web Portal.

## Claude API (Required for Travel Agent Bot)

### Setup Steps

1. **Create Account**
   - Visit [console.anthropic.com](https://console.anthropic.com)
   - Sign up or log in

2. **Get API Key**
   - Go to Settings > API Keys
   - Click "Create new API key"
   - Copy the API key

3. **Add to Travel Portal**
   - Open the app
   - Go to Settings tab
   - Paste API key in "Claude API Configuration"
   - Select model (Sonnet recommended)
   - Click "Save API Key"
   - Click "Test Connection"

4. **Enable Features**
   - Travel Agent Bot will now be enabled
   - Chat interface becomes active
   - Bot personality options available

### Pricing
- Claude 3.5 Sonnet: $3 per 1M input tokens, $15 per 1M output tokens
- Claude 3 Opus: $15 per 1M input tokens, $75 per 1M output tokens
- Claude 3 Haiku: $0.25 per 1M input tokens, $1.25 per 1M output tokens

### Free Trial
- $5 free credits with new account
- Sufficient for testing and development

## Google Maps API (Optional for Interactive Maps)

### Setup Steps

1. **Create Google Cloud Project**
   - Visit [console.cloud.google.com](https://console.cloud.google.com)
   - Create new project: "Italy Trip Portal"

2. **Enable APIs**
   - Search "Maps JavaScript API" → Enable
   - Search "Geocoding API" → Enable
   - Search "Places API" → Enable

3. **Create API Key**
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "API Key"
   - Copy the API key

4. **Set Restrictions** (Recommended)
   - Key restrictions: HTTP referrers
   - Add your domain
   - API restrictions: Select enabled APIs above

5. **Add to Travel Portal**
   - Go to Settings tab
   - Paste API key in "Google Maps API"
   - Click "Save"

### Usage in App
- Interactive maps for each destination
- Location search and pinning
- Activity location mapping
- Accommodation location display

### Pricing
- First $200/month free
- Maps JavaScript API: $0.007 per 1000 dynamic map loads
- Geocoding API: $0.005 per request
- Places API: $0.017 per request

## Skyscanner API (Optional for Flight Prices)

### Setup Steps

1. **Apply for Partnership**
   - Visit [partners.skyscanner.com](https://partners.skyscanner.com)
   - Complete partnership application
   - Wait for approval (can take 1-2 weeks)

2. **Get API Key**
   - Once approved, receive API key and credentials
   - Set up partner account

3. **Add to Travel Portal**
   - Settings tab > Skyscanner API
   - Paste API key
   - Set check frequency
   - Click "Save"

### Features
- Real-time flight price checking
- Price comparison across airlines
- Flight option recommendations
- Price history tracking

### Pricing
- Variable pricing based on traffic
- Contact Skyscanner for partner rates

## Gmail API (Optional for Flight Alerts)

### Setup Steps

1. **Enable Gmail API**
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Use same project as Maps API
   - Search "Gmail API" → Enable

2. **Create OAuth2 Credentials**
   - Go to Credentials > Create Credentials > OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/callback`
   - Download JSON credentials file

3. **Add to Travel Portal**
   - Settings tab > Gmail API
   - Paste OAuth2 credentials JSON
   - Enter your Gmail email
   - Set label to monitor
   - Click "Save"

### Features
- Automatic flight alert monitoring
- Email parsing for price drops
- Alert notifications via Telegram
- History of price changes

### Pricing
- Free with Gmail account
- No API charges

## Telegram Bot (Optional for Notifications)

### Setup Steps

1. **Create Bot**
   - Open Telegram, search @BotFather
   - Send `/start` command
   - Send `/newbot` command
   - Follow instructions to create bot
   - Copy the bot token

2. **Get Chat ID**
   - Open Telegram, search @userinfobot
   - Send `/start` command
   - It will show your Chat ID
   - Copy the number

3. **Add to Travel Portal**
   - Settings tab > Telegram Bot
   - Paste bot token
   - Paste your chat ID
   - Click "Save"
   - Click "Send test" to verify

### Features
- Flight price drop alerts
- Trip reminders
- Activity notifications
- Real-time updates

### Pricing
- Free (only requires Telegram account)

## Environment Variables (Production)

For production deployments, use environment variables instead of localStorage:

```bash
# .env.production
REACT_APP_CLAUDE_API_KEY=sk-ant-...
REACT_APP_GOOGLE_MAPS_KEY=AIzaSyD...
REACT_APP_SKYSCANNER_KEY=sk_live_...
REACT_APP_TELEGRAM_TOKEN=123456:ABC-DEF...
REACT_APP_TELEGRAM_CHAT_ID=987654321
```

## API Security Best Practices

1. **Never Commit Keys**
   - Add `.env` to `.gitignore`
   - Use environment variables in production
   - Rotate keys regularly

2. **Restrict API Keys**
   - Set domain/referrer restrictions
   - Limit API permissions to needed services only
   - Use different keys for dev/production

3. **Monitor Usage**
   - Set up billing alerts
   - Monitor API quotas
   - Review usage logs regularly

4. **Secure Storage**
   - In production: Use secure backend storage
   - Don't expose keys in client code
   - Consider using API gateway/proxy

## Troubleshooting

### Claude API Issues
- **Error: Invalid API key**
  - Check key is copied correctly (no spaces)
  - Verify key hasn't been revoked
  - Generate new key if needed

- **Rate limiting**
  - Reduce temperature (0.5 instead of 0.7)
  - Reduce max tokens
  - Add delays between requests

### Google Maps Issues
- **Map not displaying**
  - Enable all three required APIs
  - Check API key is correct
  - Verify referrer restrictions
  - Check for quota limits

- **Locations not appearing**
  - Geocoding API may need enabling
  - Check quota availability
  - Verify coordinates are correct

### General Issues
- Check browser console for errors
- Verify API keys in browser DevTools Storage
- Test each API independently
- Check API provider status pages
- Review usage quotas and billing

## Support

For API-specific issues:
- Claude: [docs.anthropic.com](https://docs.anthropic.com)
- Google Maps: [cloud.google.com/maps-platform](https://cloud.google.com/maps-platform)
- Skyscanner: [partners.skyscanner.com/support](https://partners.skyscanner.com/support)
- Telegram: [core.telegram.org/bots](https://core.telegram.org/bots)

---

**Happy configured! 🚀**
