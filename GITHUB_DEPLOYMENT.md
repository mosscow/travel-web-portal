# GitHub Deployment Instructions

## 🚀 Push to GitHub

The project is ready to be pushed to your GitHub repository. Follow these steps:

### Prerequisites
- Git installed on your system
- GitHub account
- Repository created: https://github.com/mosscow/travel-web-portal

### Step 1: Navigate to Project
```bash
cd travel-web-portal
```

### Step 2: Check Git Status
```bash
git status
```

You should see all files committed with message:
```
Initial commit: Complete travel web portal with AI bot, maps, and trip planning
```

### Step 3: Add Remote and Push

```bash
# Set remote (if not already set)
git remote add origin https://github.com/mosscow/travel-web-portal.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

**Wait for completion. You should see:**
```
Counting objects: 17, done.
...
To https://github.com/mosscow/travel-web-portal.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

### Step 4: Verify on GitHub
1. Go to https://github.com/mosscow/travel-web-portal
2. Verify all files are visible
3. Check commits tab shows your commit

---

## 🔧 GitHub Pages Setup (Optional - Free Hosting)

To get a free website at `https://mosscow.github.io/travel-web-portal/`:

### Option A: Automatic (Recommended)

1. **Go to Repository Settings**
   - https://github.com/mosscow/travel-web-portal/settings

2. **Scroll to "Pages" Section**

3. **Configure**
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
   - Click "Save"

4. **Wait 1-2 minutes**
   - GitHub will build and deploy
   - You'll see a green checkmark
   - Site will be live!

5. **Access Your Site**
   - https://mosscow.github.io/travel-web-portal/

### Option B: Using gh-pages Branch

```bash
# Create and push gh-pages branch
git checkout -b gh-pages
git push origin gh-pages

# Go to Settings > Pages
# Select "gh-pages" branch
# Click Save
```

---

## ⚡ Deploy to Vercel (Faster - 30 seconds)

### Step 1: Go to Vercel
- Visit https://vercel.com
- Sign in with GitHub

### Step 2: Create New Project
- Click "New Project"
- Click "Import Git Repository"
- Paste: `https://github.com/mosscow/travel-web-portal.git`
- Click "Import"

### Step 3: Configure
- Framework Preset: `Other` (it's static HTML)
- Root Directory: `.` (or leave blank)
- Click "Deploy"

### Step 4: Wait for Deployment
- Vercel builds automatically
- Takes ~30-60 seconds
- You'll get a preview URL
- Production URL: `travel-web-portal.vercel.app`

---

## 🌐 Deploy to Netlify (30 seconds)

### Step 1: Go to Netlify
- Visit https://netlify.com
- Sign up / Sign in with GitHub

### Step 2: Create New Site
- Click "Add new site"
- Select "Import an existing project"
- Click "GitHub"
- Choose repository: `travel-web-portal`

### Step 3: Configure
- Build command: (leave blank)
- Publish directory: `.` (current directory)
- Click "Deploy site"

### Step 4: Complete
- Netlify deploys automatically
- Your site is live in ~2 minutes
- You can set custom domain
- Auto-deploys on push to main

---

## 📋 File Checklist

Verify all files are on GitHub:

### Root Files ✓
- [ ] index.html
- [ ] README.md
- [ ] SETUP.md
- [ ] API_CONFIG.md
- [ ] PROJECT_SUMMARY.md
- [ ] .gitignore

### JavaScript Files ✓
- [ ] js/config.js
- [ ] js/api.js
- [ ] js/storage.js
- [ ] js/trip-data.js
- [ ] js/ui-components.js
- [ ] js/main.js
- [ ] js/travel-agent-bot.js
- [ ] js/settings.js

### CSS Files ✓
- [ ] styles/global.css
- [ ] styles/trip-planner.css
- [ ] styles/chat.css

---

## 🔐 Environment Variables for Production

If deploying to Vercel/Netlify with backend:

1. **Create .env.production**
```
REACT_APP_CLAUDE_API_KEY=sk-ant-...
REACT_APP_GOOGLE_MAPS_KEY=AIzaSyD...
```

2. **In Vercel/Netlify:**
   - Go to Settings > Environment Variables
   - Add each variable
   - Redeploy

3. **In Code:**
```javascript
// Use in code:
const apiKey = process.env.REACT_APP_CLAUDE_API_KEY;
```

---

## 🎯 Access Your Live Site

After deployment, your site is available at:

| Platform | URL | Time to Deploy |
|----------|-----|-----------------|
| GitHub Pages | `https://mosscow.github.io/travel-web-portal/` | 2-3 minutes |
| Vercel | `https://travel-web-portal.vercel.app` | 30-60 seconds |
| Netlify | `https://travel-web-portal.netlify.app` | 1-2 minutes |

---

## 📝 Add Custom Domain

### For GitHub Pages
1. Settings > Pages
2. Custom domain field
3. Enter: `travel.yourdomain.com`
4. Add DNS records (info provided)

### For Vercel
1. Settings > Domains
2. Click "Add"
3. Enter: `travel.yourdomain.com`
4. Follow DNS instructions

### For Netlify
1. Settings > Domain management
2. Click "Add custom domain"
3. Enter: `travel.yourdomain.com`
4. Point DNS to Netlify

---

## 🔄 Continuous Deployment

All platforms auto-deploy when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update trip planner"
git push origin main

# Wait 30 seconds - 2 minutes
# Your changes are automatically live!
```

---

## 📊 Monitor Your Deployment

### GitHub Pages
- Status: https://github.com/mosscow/travel-web-portal/deployments
- Analytics: Settings > Pages > View traffic

### Vercel
- Dashboard: https://vercel.com/dashboard
- Analytics: Built-in
- Performance: Real User Monitoring (RUM)

### Netlify
- Dashboard: https://app.netlify.com
- Analytics: Built-in
- Forms & Functions: Available

---

## 🆘 Troubleshooting Deployment

### GitHub Pages Not Showing
1. Check Settings > Pages
2. Verify branch is `main`
3. Ensure `index.html` is in root
4. Wait 3-5 minutes
5. Clear browser cache (Ctrl+Shift+Delete)

### Vercel/Netlify 404 Error
1. Check build logs
2. Verify `index.html` exists
3. Check root directory setting
4. Try redeploy button

### Domain Not Resolving
1. Check DNS records
2. Wait 24-48 hours for DNS propagation
3. Verify domain registrar settings
4. Use DNS checker: https://mxtoolbox.com

---

## 📚 Next Steps

After deployment:

1. **Test the Site**
   - Visit your deployed URL
   - Test all features
   - Check API integration

2. **Configure APIs**
   - Add Claude API key in Settings
   - Add Google Maps key (optional)
   - Test connections

3. **Share with Others**
   - Send deployed URL
   - Create GitHub issues for feedback
   - Add contributors

4. **Keep It Updated**
   - Create feature branches
   - Submit pull requests
   - Merge to main for auto-deploy

---

## 🎉 You're Done!

Your Travel Web Portal is now live on the internet!

**Deployed URL:** https://github.com/mosscow/travel-web-portal

**Share with friends:** "Check out my travel planner app!"

---

## 📞 Support

- **GitHub Issues:** https://github.com/mosscow/travel-web-portal/issues
- **README:** See documentation in repo
- **API Help:** See API_CONFIG.md

---

**Happy deploying! 🚀**
