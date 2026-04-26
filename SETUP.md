# Setup & Deployment Guide

## Quick Start (5 minutes)

### 1. Clone Repository
```bash
git clone https://github.com/mosscow/travel-web-portal.git
cd travel-web-portal
```

### 2. Start Local Server
```bash
# Option 1: Python 3
python -m http.server 8000

# Option 2: Python 2
python -m SimpleHTTPServer 8000

# Option 3: Node.js
npx http-server

# Option 4: Ruby
ruby -run -ehttpd . -p8000
```

### 3. Open in Browser
```
http://localhost:8000
```

### 4. Configure Claude API
1. Get API key from [console.anthropic.com](https://console.anthropic.com)
2. Go to Settings tab
3. Paste API key in "Claude API Configuration"
4. Click "Save API Key"
5. Click "Test Connection"

✅ Done! Travel Agent Bot is ready to use.

---

## Full Installation Guide

### Prerequisites
- Git
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Claude API key (from Anthropic)
- Google Maps API key (optional)

### Step 1: Clone Repository

```bash
git clone https://github.com/mosscow/travel-web-portal.git
cd travel-web-portal
```

### Step 2: Verify Files

Check that you have:
```
travel-web-portal/
├── index.html
├── styles/
│   ├── global.css
│   ├── trip-planner.css
│   └── chat.css
├── js/
│   ├── config.js
│   ├── api.js
│   ├── storage.js
│   ├── trip-data.js
│   ├── ui-components.js
│   ├── main.js
│   ├── travel-agent-bot.js
│   └── settings.js
├── README.md
├── API_CONFIG.md
└── .gitignore
```

### Step 3: Get API Keys

**Claude API (Required)**
1. Visit https://console.anthropic.com
2. Sign in or create account
3. Click "API Keys" in sidebar
4. Click "Create new API key"
5. Copy the key

**Google Maps API (Optional)**
1. Visit https://console.cloud.google.com
2. Create new project
3. Enable Maps JavaScript API
4. Enable Geocoding API
5. Enable Places API
6. Create API key under Credentials
7. (Optional) Add domain restrictions

### Step 4: Start Server

Choose your preferred method:

**Python 3 (Recommended)**
```bash
python -m http.server 8000
```

**Node.js**
```bash
npx http-server
```

**Live Server (VS Code)**
```bash
# Install extension "Live Server"
# Right-click index.html → "Open with Live Server"
```

### Step 5: Access Application

1. Open browser
2. Go to `http://localhost:8000`
3. You should see the Italy Trip 2027 planner

### Step 6: Configure APIs

1. **Claude API**
   - Go to "⚙️ Settings" tab
   - Paste Claude API key in field
   - Click "Save API Key"
   - Click "Test Connection"

2. **Google Maps (Optional)**
   - Go to "⚙️ Settings" tab
   - Paste Google Maps API key
   - Click "Save"

3. **Travel Agent Bot**
   - Go to "🤖 Travel agent bot" tab
   - Start chatting!
   - Bot suggests activities, restaurants, flights

---

## Deployment Options

### Option 1: GitHub Pages (Free)

1. **Create GitHub Pages Branch**
```bash
cd travel-web-portal
git checkout -b gh-pages
git push origin gh-pages
```

2. **Enable GitHub Pages**
   - Go to Repository Settings
   - Scroll to "Pages"
   - Source: Select `gh-pages` branch
   - Click Save

3. **Access Your Site**
   - Available at `https://mosscow.github.io/travel-web-portal/`

### Option 2: Vercel (Free)

1. **Connect Repository**
   - Go to https://vercel.com
   - Click "New Project"
   - Import GitHub repository
   - Select `travel-web-portal`

2. **Deploy**
   - Vercel auto-detects it's a static site
   - Click "Deploy"
   - Available at `travel-web-portal.vercel.app`

### Option 3: Netlify (Free)

1. **Connect Repository**
   - Go to https://netlify.com
   - Click "New site from Git"
   - Connect GitHub
   - Select repository

2. **Configure**
   - Build command: (leave empty)
   - Publish directory: `.` (or leave blank)
   - Click "Deploy"

3. **Access Site**
   - Custom domain available
   - Auto-deployed on push to main

### Option 4: Self-Hosted VPS

1. **Rent VPS**
   - DigitalOcean, Linode, AWS, etc.
   - ~$5/month minimum

2. **SSH into Server**
```bash
ssh root@your_server_ip
```

3. **Clone Repository**
```bash
cd /var/www
git clone https://github.com/mosscow/travel-web-portal.git
cd travel-web-portal
```

4. **Setup Nginx**
```bash
sudo apt update
sudo apt install nginx
sudo cp -r /var/www/travel-web-portal /var/www/html/
sudo systemctl restart nginx
```

5. **Access**
   - Visit `http://your_server_ip`

---

## Development Setup

### Prerequisites
- Node.js (optional, for dev tools)
- Git
- Text editor (VS Code recommended)

### Local Development

1. **Clone Repository**
```bash
git clone https://github.com/mosscow/travel-web-portal.git
cd travel-web-portal
```

2. **Start Dev Server**
```bash
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js
npx http-server --port 8000 --cors
```

3. **Open Editor**
```bash
# Option 1: VS Code
code .

# Option 2: WebStorm
webstorm .

# Option 3: Sublime Text
subl .
```

4. **Edit Files**
   - Modify files in `js/`, `styles/`, `index.html`
   - Browser auto-refreshes (with Live Server)
   - Changes persist in localStorage

### Making Changes

#### Add New Feature
1. Create branch: `git checkout -b feature/my-feature`
2. Edit relevant files
3. Test in browser
4. Commit: `git commit -am "Add my feature"`
5. Push: `git push origin feature/my-feature`
6. Create Pull Request on GitHub

#### File Structure Guide
- **config.js** - App settings and constants
- **api.js** - API calls (Claude, Maps, etc.)
- **storage.js** - LocalStorage management
- **trip-data.js** - Trip information and manager
- **ui-components.js** - Reusable UI elements
- **main.js** - App initialization
- **travel-agent-bot.js** - Chat bot functionality
- **settings.js** - Settings page logic

---

## Environment Variables (Production)

Create `.env` file for sensitive data:

```env
# .env (DO NOT COMMIT)
CLAUDE_API_KEY=sk-ant-...
GOOGLE_MAPS_KEY=AIzaSyD...
SKYSCANNER_KEY=sk_live_...
TELEGRAM_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=987654321
```

Add to `.gitignore`:
```
.env
.env.local
api-keys.json
credentials.json
```

---

## Troubleshooting

### Problem: Blank Page
- **Solution 1:** Clear browser cache (Ctrl+Shift+Delete)
- **Solution 2:** Check browser console (F12) for errors
- **Solution 3:** Try different browser
- **Solution 4:** Restart server

### Problem: API Keys Not Working
- **Solution 1:** Verify key is copied correctly (no spaces)
- **Solution 2:** Check API is enabled in cloud provider
- **Solution 3:** Verify domain/referrer restrictions
- **Solution 4:** Generate new key
- **Solution 5:** Check API quotas aren't exceeded

### Problem: Maps Not Showing
- **Solution 1:** Ensure Google Maps API key is set
- **Solution 2:** Enable all three required APIs
- **Solution 3:** Check Geocoding API is enabled
- **Solution 4:** Verify referrer restrictions allow localhost

### Problem: Bot Not Responding
- **Solution 1:** Ensure Claude API key is configured
- **Solution 2:** Click "Test Connection" to verify
- **Solution 3:** Check API key has sufficient credits
- **Solution 4:** Check browser console for errors

### Problem: Data Not Saving
- **Solution 1:** Ensure localStorage is enabled
- **Solution 2:** Check browser storage quota
- **Solution 3:** Try exporting data as backup
- **Solution 4:** Clear cache and try again

---

## Performance Optimization

### Browser Cache
```bash
# .htaccess (if using Apache)
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 1 hour"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### CDN Delivery
- Vercel CDN: Automatic
- Netlify CDN: Automatic
- GitHub Pages: Use Cloudflare CDN

### Compression
```nginx
# nginx.conf
gzip on;
gzip_types text/plain text/css application/javascript;
gzip_level 6;
```

---

## Monitoring & Maintenance

### Check Server Status
```bash
# SSH into server
ssh user@server.com

# Check disk space
df -h

# Check memory
free -m

# Check running processes
ps aux | grep http
```

### Backup Data
```bash
# Backup to local machine
scp -r user@server:/var/www/html/travel-web-portal backup/

# Backup to cloud
gsutil -m cp -r gs://my-bucket/backup/
```

### Update Repository
```bash
cd /var/www/travel-web-portal
git pull origin main
```

---

## Security Checklist

- [ ] Never commit API keys
- [ ] Use HTTPS in production
- [ ] Enable CORS only for trusted domains
- [ ] Set API key restrictions
- [ ] Monitor API usage and billing
- [ ] Regular security updates
- [ ] Use environment variables for secrets
- [ ] Enable logging and monitoring
- [ ] Backup data regularly
- [ ] Test disaster recovery

---

## Additional Resources

- **Claude Documentation:** https://docs.anthropic.com
- **Google Maps API:** https://cloud.google.com/maps-platform
- **Git Guide:** https://git-scm.com/book
- **Deployment:** https://www.netlify.com, https://vercel.com
- **MDN Web Docs:** https://developer.mozilla.org

---

**You're all set! 🚀**

Start your travel planning journey with the Travel Web Portal!

For issues or questions, open a GitHub issue: https://github.com/mosscow/travel-web-portal/issues
