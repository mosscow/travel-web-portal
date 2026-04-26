# GitHub Pages with Username/Password Authentication

Deploy your Travel Web Portal to GitHub Pages with basic username/password protection.

---

## 📋 Overview

GitHub Pages doesn't natively support password protection, but we can add it using:

1. **HTML/JavaScript Authentication** - Client-side (simple)
2. **Cloudflare Workers** - Secure, serverless (recommended)
3. **Vercel Authentication** - Easiest integration
4. **Firebase Authentication** - Full auth system

This guide covers all options, from simplest to most secure.

---

## ⚡ Option 1: Simple HTML Authentication (Easiest)

### 1.1 Create Authentication Page

Create `auth.html` in your repository root:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Travel Portal - Login</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .login-container {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      width: 100%;
      max-width: 400px;
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .login-header h1 {
      font-size: 28px;
      color: #1976D2;
      margin-bottom: 0.5rem;
    }

    .login-header p {
      color: #666;
      font-size: 14px;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
      margin-bottom: 8px;
    }

    input[type="text"],
    input[type="password"] {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      transition: border-color 0.2s;
    }

    input[type="text"]:focus,
    input[type="password"]:focus {
      outline: none;
      border-color: #1976D2;
      box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
    }

    button {
      width: 100%;
      padding: 12px;
      background: #1976D2;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    button:hover {
      background: #1565C0;
    }

    button:active {
      transform: scale(0.98);
    }

    .error-message {
      color: #d32f2f;
      font-size: 12px;
      margin-top: 1rem;
      text-align: center;
      display: none;
    }

    .remember-me {
      display: flex;
      align-items: center;
      font-size: 12px;
      margin-bottom: 1.5rem;
    }

    .remember-me input {
      margin-right: 8px;
      cursor: pointer;
    }

    .remember-me label {
      margin: 0;
      cursor: pointer;
      text-transform: none;
      font-weight: 400;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="login-header">
      <h1>🇮🇹 Travel Portal</h1>
      <p>Italy Trip 2027 Planner</p>
    </div>

    <form id="loginForm" onsubmit="handleLogin(event)">
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" required placeholder="Enter username">
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" required placeholder="Enter password">
      </div>

      <div class="remember-me">
        <input type="checkbox" id="rememberMe">
        <label for="rememberMe">Remember me for 30 days</label>
      </div>

      <button type="submit">Login</button>

      <div class="error-message" id="errorMessage"></div>
    </form>
  </div>

  <script>
    // Configuration - CHANGE THESE!
    const VALID_CREDENTIALS = [
      { username: 'admin', password: 'travel2027' },
      { username: 'user', password: 'password123' }
    ];

    const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

    // Check if already logged in
    function checkAuth() {
      const authData = localStorage.getItem('travel-portal-auth');
      
      if (authData) {
        try {
          const { token, timestamp } = JSON.parse(authData);
          const now = new Date().getTime();
          
          // Check if session expired
          if (now - timestamp < SESSION_DURATION) {
            // Session still valid
            redirect();
            return;
          } else {
            // Session expired
            localStorage.removeItem('travel-portal-auth');
          }
        } catch (e) {
          localStorage.removeItem('travel-portal-auth');
        }
      }
    }

    // Handle login
    function handleLogin(event) {
      event.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const rememberMe = document.getElementById('rememberMe').checked;
      const errorDiv = document.getElementById('errorMessage');

      // Validate credentials
      const isValid = VALID_CREDENTIALS.some(
        cred => cred.username === username && cred.password === password
      );

      if (isValid) {
        // Create session
        const token = btoa(`${username}:${password}:${new Date().getTime()}`);
        const authData = {
          token: token,
          timestamp: new Date().getTime(),
          username: username
        };

        if (rememberMe) {
          localStorage.setItem('travel-portal-auth', JSON.stringify(authData));
          sessionStorage.setItem('travel-portal-auth', JSON.stringify(authData));
        } else {
          sessionStorage.setItem('travel-portal-auth', JSON.stringify(authData));
        }

        // Redirect to app
        redirect();
      } else {
        // Show error
        errorDiv.textContent = 'Invalid username or password';
        errorDiv.style.display = 'block';
        
        // Clear password field
        document.getElementById('password').value = '';
        
        // Hide error after 3 seconds
        setTimeout(() => {
          errorDiv.style.display = 'none';
        }, 3000);
      }
    }

    // Redirect to app
    function redirect() {
      // Change this to your app path if different
      window.location.href = 'index.html';
    }

    // Check authentication on page load
    window.addEventListener('DOMContentLoaded', checkAuth);
  </script>
</body>
</html>
```

### 1.2 Update index.html

Add this to the top of `index.html` (before other code):

```html
<script>
  // Check authentication before loading app
  (function() {
    const authData = localStorage.getItem('travel-portal-auth') || 
                     sessionStorage.getItem('travel-portal-auth');
    
    if (!authData) {
      // Not logged in, redirect to login page
      window.location.href = 'auth.html';
    } else {
      try {
        const { timestamp } = JSON.parse(authData);
        const now = new Date().getTime();
        const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
        
        if (now - timestamp > SESSION_DURATION) {
          // Session expired
          localStorage.removeItem('travel-portal-auth');
          sessionStorage.removeItem('travel-portal-auth');
          window.location.href = 'auth.html';
        }
      } catch (e) {
        window.location.href = 'auth.html';
      }
    }
  })();
</script>
```

### 1.3 Add Logout Button

Add this to your app (in main.js or settings.js):

```javascript
// Logout function
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('travel-portal-auth');
    sessionStorage.removeItem('travel-portal-auth');
    window.location.href = 'auth.html';
  }
}

// Add logout button to settings or header
const logoutBtn = document.createElement('button');
logoutBtn.textContent = '🚪 Logout';
logoutBtn.onclick = logout;
// Add to your UI somewhere
```

### 1.4 Change Credentials (IMPORTANT!)

In `auth.html`, change these credentials:

```javascript
// Configuration - CHANGE THESE!
const VALID_CREDENTIALS = [
  { username: 'your_username', password: 'your_secure_password' },
  { username: 'another_user', password: 'another_password' }
];
```

### 1.5 Deploy to GitHub Pages

```bash
git add auth.html
git commit -m "Add authentication to GitHub Pages"
git push origin main
```

Your site now requires login!

---

## 🔐 Option 2: Cloudflare Workers (Recommended - More Secure)

### 2.1 Create Cloudflare Worker

1. Go to https://workers.cloudflare.com
2. Sign up / Sign in
3. Create new worker
4. Paste this code:

```javascript
// Cloudflare Worker for Travel Portal Authentication

const VALID_CREDENTIALS = {
  'your_username': 'your_password',
  'another_user': 'another_password'
};

const SESSION_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

async function handleRequest(request) {
  const url = new URL(request.url);

  // Check if requesting login page
  if (url.pathname === '/' || url.pathname === '/auth' || url.pathname === '/login') {
    return handleAuth(request);
  }

  // Check authentication for other pages
  const auth = request.headers.get('Authorization');
  
  if (!auth) {
    return loginResponse();
  }

  const [scheme, credentials] = auth.split(' ');
  
  if (scheme !== 'Basic') {
    return loginResponse();
  }

  const [username, password] = atob(credentials).split(':');

  if (VALID_CREDENTIALS[username] === password) {
    // Authenticated - proxy to GitHub Pages
    const githubURL = new URL(url.pathname + url.search, 'https://mosscow.github.io/travel-web-portal/');
    
    return fetch(githubURL, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
  }

  return loginResponse();
}

function loginResponse() {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Travel Portal"',
      'Content-Type': 'text/html'
    },
    body: getLoginHTML()
  });
}

function getLoginHTML() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Travel Portal - Login</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0;
        }
        .container {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          width: 100%;
          max-width: 400px;
        }
        h1 { color: #1976D2; text-align: center; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; font-size: 12px; font-weight: 600; color: #666; margin-bottom: 8px; }
        input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
        button { width: 100%; padding: 12px; background: #1976D2; color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer; }
        button:hover { background: #1565C0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🇮🇹 Travel Portal</h1>
        <p style="text-align: center; color: #666;">Please login to continue</p>
        <form onsubmit="handleLogin(event)">
          <div class="form-group">
            <label>Username</label>
            <input type="text" id="username" required placeholder="Enter username">
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="password" required placeholder="Enter password">
          </div>
          <button type="submit">Login</button>
        </form>
      </div>
      <script>
        function handleLogin(event) {
          event.preventDefault();
          const username = document.getElementById('username').value;
          const password = document.getElementById('password').value;
          const credentials = btoa(username + ':' + password);
          
          fetch(window.location.href, {
            headers: {
              'Authorization': 'Basic ' + credentials
            }
          }).then(response => {
            if (response.ok) {
              window.location.reload();
            } else {
              alert('Invalid credentials');
            }
          });
        }
      </script>
    </body>
    </html>
  `;
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
```

### 2.2 Update Credentials

Change these in the worker:

```javascript
const VALID_CREDENTIALS = {
  'your_username': 'your_password',
  'another_user': 'another_password'
};
```

### 2.3 Deploy Worker

1. Click "Save and Deploy"
2. Go to "Add Route"
3. Route: `mosscow.github.io/travel-web-portal/*`
4. Worker: Your worker name
5. Zone: Your domain
6. Save

---

## ✅ Option 3: Vercel with Authentication

Vercel offers built-in password protection.

### 3.1 Deploy to Vercel

1. Go to https://vercel.com
2. Import GitHub repository
3. Deploy

### 3.2 Add Password Protection

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Add environment variable for auth
vercel env add PROTECTED_ROUTES /

# Create vercel.json
```

Create `vercel.json`:

```json
{
  "env": {
    "AUTH_USERNAME": "@auth_username",
    "AUTH_PASSWORD": "@auth_password"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600"
        }
      ]
    }
  ]
}
```

---

## 🔒 Security Best Practices

### 1. For HTML/JavaScript Auth

**DO:**
- Change default credentials immediately
- Use strong passwords
- Encourage users to use "Remember me" carefully
- Store sessions in localStorage (not visible in browser console)

**DON'T:**
- Use hardcoded credentials in public GitHub
- Use simple passwords like "password123"
- Share the password publicly
- Rely solely on client-side auth for sensitive data

### 2. For Cloudflare Workers

**DO:**
- Use Cloudflare's built-in security
- Enable HTTP/2 push
- Use strong credentials
- Monitor worker analytics

**DON'T:**
- Expose credentials in code
- Use same password for all apps
- Share worker URLs publicly

### 3. General Security

```bash
# Never commit credentials to GitHub
echo "auth.html" >> .gitignore
git rm --cached auth.html
```

---

## 🔄 Updating Credentials

### HTML/JavaScript Method

1. Update `auth.html`
2. Commit and push
3. Changes take effect immediately

### Cloudflare Workers

1. Go to worker
2. Edit credentials
3. Click "Save and Deploy"
4. Changes take effect in seconds

---

## 🆘 Troubleshooting

### Blank Page After Login

- Check browser console (F12)
- Verify `index.html` has auth check script
- Clear localStorage and try again

### Wrong Password Loops

- Check credentials in `auth.html`
- Try in incognito mode
- Clear browser cache

### Cloudflare Not Working

- Verify domain is on Cloudflare
- Check worker logs
- Verify route pattern is correct

---

## 🎯 Which Option Should You Use?

| Option | Ease | Security | Cost |
|--------|------|----------|------|
| HTML/JS | ⭐⭐⭐⭐⭐ | ⭐⭐ | Free |
| Cloudflare | ⭐⭐⭐ | ⭐⭐⭐⭐ | Free tier |
| Vercel | ⭐⭐⭐⭐ | ⭐⭐⭐ | Free tier |

**Recommendation:**
- **Quick & Easy:** Use HTML/JavaScript method
- **Production & Secure:** Use Cloudflare Workers
- **Best UX:** Use Vercel

---

## 📝 Credentials to Use

Generate strong passwords:

```bash
# macOS/Linux
openssl rand -base64 16

# Windows PowerShell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..16 | ForEach-Object { [char](Get-Random -InputObject (48..57+65..90+97..122)) } | Join-String)))
```

---

## ✅ Deployment Checklist

- [ ] Choose authentication method
- [ ] Update credentials
- [ ] Add auth check to index.html
- [ ] Test login page
- [ ] Test logout
- [ ] Verify remember me works
- [ ] Test on mobile
- [ ] Deploy to GitHub/Vercel/Cloudflare
- [ ] Test live deployment

---

## 🎉 Your Site is Protected!

Your Travel Web Portal is now password-protected and accessible from anywhere with GitHub Pages!

---

**Happy secure traveling! 🔒 🇮🇹**
