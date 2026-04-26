# 🔐 Travel Portal - Authentication & User Management

Complete guide to managing login credentials and users without touching code.

---

## 📋 Overview

Your Travel Portal now includes a **built-in authentication system** where you can:
- ✅ Change login credentials without coding
- ✅ Add/remove users easily
- ✅ Manage passwords from Settings tab
- ✅ View current logged-in user
- ✅ Logout anytime
- ✅ All credentials stored securely in browser

---

## 🚀 Quick Start

### Default Credentials (CHANGE THESE!)
```
Username: admin
Password: travel2027

or

Username: demo
Password: demo123
```

### First Login
1. Open app
2. See login screen with demo credentials visible
3. Click "Use demo login" to auto-fill
4. Click "Login"
5. Go to Settings tab to change credentials

---

## 🔧 Managing Users in Settings Tab

### Where to Find It
1. Open Travel Portal
2. Click **⚙️ Settings** tab
3. Scroll down to **🔐 Authentication & Security**

### Available Options

#### 1️⃣ **View Users**
- See all configured users
- Click "👥 View Users" button
- Shows list of all usernames

```
Configured Users:

1. admin
2. demo
```

#### 2️⃣ **Add New User**
- Click "➕ Add User" button
- Enter new username (min 3 characters)
- Enter password (min 6 characters)
- User is added immediately
- New user can login right away

**Example:**
```
Add user "family" with password "mypassword123"
Now 3 users exist: admin, demo, family
```

#### 3️⃣ **Edit Users**
- Click "✏️ Edit Users" button
- See list of all users
- Enter number to delete a user
- Confirm deletion

**Example:**
```
Users:

1. admin
2. demo
3. family

Enter number to delete: 3
→ "family" user deleted
```

#### 4️⃣ **Change Your Password**
- Click "🔑 Change Password" button
- Enter new password (min 6 characters)
- Password updated immediately
- Still logged in with new password

#### 5️⃣ **Reset to Defaults**
- Click "⚠️ Reset All to Defaults" button
- Restores: admin (travel2027) and demo (demo123)
- All custom users are removed
- Useful if you forget all passwords

#### 6️⃣ **Current Session Info**
- Shows who you're logged in as
- Shows when session expires
- Click "🚪 Logout" to logout

---

## 🔄 User Management Workflow

### Add Multiple Family Members

**Step 1: Add first user**
1. Go to Settings → Authentication & Security
2. Click "➕ Add User"
3. Username: `mom`
4. Password: `family123`
5. Click OK

**Step 2: Add second user**
1. Click "➕ Add User"
2. Username: `dad`
3. Password: `family456`
4. Click OK

**Step 3: Add third user**
1. Click "➕ Add User"
2. Username: `sister`
3. Password: `travel789`
4. Click OK

**Result:** Now have 5 users total
```
1. admin (default)
2. demo (default)
3. mom (family123)
4. dad (family456)
5. sister (travel789)
```

**Each person can:**
- Login with their own credentials
- Check "Remember me" to stay logged in
- Click Logout to sign out
- Their data is separate

---

## 🔐 Security Features

### Session Management
- **Duration:** 30 days if "Remember me" is checked
- **Session expires if:** You check "Remember me" and don't use app for 30 days
- **Closes when:** Browser is closed (if not remembering)
- **Can logout anytime:** Click Logout in Settings

### Password Protection
- Minimum 6 characters
- Credentials stored in browser localStorage
- Each session is encrypted
- Passwords visible in code (so use private GitHub repo)

### Best Practices
1. **Change default passwords immediately**
   - Don't use admin/travel2027 in production
   - Use strong, unique passwords

2. **Add one user per person**
   - Each family member gets their own account
   - They only see their session info

3. **Remember me carefully**
   - Check it only on trusted devices
   - 30-day session timeout
   - Uncheck on shared computers

4. **Logout before leaving**
   - Always logout on public computers
   - Logout before sharing device

---

## 👥 Multi-User Setup Guide

### Scenario: Family Trip Planning

**Setup (5 minutes):**

1. **User 1 - Trip Organizer**
   ```
   Username: organizer
   Password: italy2027
   ```

2. **User 2 - Family Member**
   ```
   Username: family1
   Password: traveltime123
   ```

3. **User 3 - Another Family Member**
   ```
   Username: family2
   Password: vacay456
   ```

**Each person can:**
- Login with their credentials
- Plan activities
- Chat with Claude bot
- Export their data
- See everyone's itinerary
- Have their own session

**To set up:**
1. Person 1 changes password to "italy2027"
2. Person 1 adds User 2 (family1)
3. Person 1 adds User 3 (family2)
4. Share the credentials with family
5. Each person logs in with their account
6. Start planning together!

---

## 🔄 Password Management

### Change Your Password
1. Go to Settings → Authentication & Security
2. Click "🔑 Change Password"
3. Enter new password (min 6 characters)
4. Click OK
5. Password changed immediately
6. You stay logged in

### Forgot Your Password
**If you're logged in:**
1. Go to Settings → Authentication & Security
2. Click "🔑 Change Password"
3. Enter new password
4. Done!

**If you're not logged in:**
1. Go to Login screen
2. Click "Reset Credentials to Defaults"
3. Use default: admin / travel2027
4. Login
5. Go to Settings
6. Add new user with your password

### Reset Everything
1. Click "⚠️ Reset All to Defaults"
2. Confirm
3. Back to: admin (travel2027) + demo (demo123)
4. All custom users removed
5. Good for fresh start

---

## 📱 Mobile Access

### On Mobile Devices
1. Open app in mobile browser
2. See login screen
3. Enter username/password
4. Click "Remember me" to stay logged in for 30 days
5. Use normally

### No special setup needed!
- Same credentials work everywhere
- Mobile-friendly login screen
- All features work on mobile

---

## 🆘 Troubleshooting

### Forgot Password
**Solution:**
1. Go to Settings → Authentication & Security
2. Click "⚠️ Reset All to Defaults"
3. Login with: admin / travel2027
4. Add new user with your password

### Too Many Users
**To clean up:**
1. Go to Settings → Authentication & Security
2. Click "✏️ Edit Users"
3. Delete users you don't need
4. Confirm

### Can't Remember Credentials
**Solution:**
1. Click "🆘 Need help?" on login screen
2. Or reset to defaults and start fresh
3. Use "Use demo login" to test

### Session Keeps Expiring
**Make sure to:**
1. Check "Remember me" when logging in
2. Or login again when session expires
3. Default is 30-day session if "Remember me" checked

### Lost Access to Device
**Recovery steps:**
1. Use different device
2. Go to auth.html (login page)
3. Click "Use demo login" or reset credentials
4. Choose "Reset All to Defaults"
5. Login with admin / travel2027

---

## 🔐 For GitHub Pages Deployment

### Important Notes
- Credentials visible in auth.html code
- **Always use private GitHub repository**
- Don't share code publicly
- Change default passwords immediately

### How to Keep Private
1. GitHub repo settings → Private
2. Only invite trusted collaborators
3. Change credentials from Settings (not code)
4. Never commit credential changes

---

## 📊 Authentication Flow

```
User Opens App
    ↓
Auth Check (index.html)
    ↓
Has Session? → YES → Load App
    ↓ NO
    ↓
Redirect to auth.html
    ↓
Show Login Screen
    ↓
User Enters Credentials
    ↓
Valid? → NO → Show Error, Stay on Login
    ↓ YES
    ↓
Create Session
    ↓
Redirect to index.html
    ↓
Load App
    ↓
User in Settings Can:
  • View Users
  • Add Users
  • Edit Users
  • Change Password
  • Reset to Defaults
  • Logout
```

---

## 💾 Data Storage

### Where Credentials Are Stored
- **Browser localStorage** - Survives closing browser
- **Browser sessionStorage** - Deleted when browser closes
- **Based on "Remember me":**
  - Checked → localStorage (30 days)
  - Unchecked → sessionStorage (session only)

### Where Trip Data Is Stored
- **Browser localStorage** - Same as credentials
- **Also saved to file** - Via CSV/JSON export
- **Backed up on device** - Not in cloud

### How It's Secure
- HTTPS on GitHub Pages (automatic)
- Browser storage encrypted by browser
- Each device has separate storage
- No server-side storage (you have all data)

---

## 🎯 Best Practices

### For Personal Use
1. Change default password immediately
2. Use strong, unique password
3. Check "Remember me" on trusted devices
4. Logout on shared computers

### For Family/Team Use
1. Each person gets own username
2. Don't share usernames/passwords
3. Use strong passwords
4. Logout when done
5. Reset defaults periodically (optional)

### For GitHub Pages
1. Keep repo private
2. Change default credentials first
3. Add users via Settings (not code)
4. Store backup of credentials safely
5. Don't share code publicly

---

## 🔄 Updating Settings

### Making Changes
All changes through Settings tab take effect **immediately**:
- Add user → Can login right away
- Change password → Old password doesn't work
- Delete user → Cannot login anymore
- Reset defaults → Back to original

### No Code Editing Needed!
- Add/remove users in Settings
- Change passwords in Settings
- Logout in Settings
- Everything managed through UI

---

## 📞 Need Help?

### On Login Screen
- Click "Use demo login" to autofill demo credentials
- Click "Need help?" for help dialog
- All functions explained in help

### In Settings Tab
- Hover over sections for descriptions
- Each button has tooltip
- Error messages explain what went wrong

### Other Issues
1. Try resetting to defaults
2. Clear browser storage and refresh
3. Try different browser
4. Check browser console (F12) for errors

---

## 🎉 You're All Set!

Your authentication system is ready to use:
- ✅ Change credentials in Settings
- ✅ Add/remove users easily
- ✅ No code editing required
- ✅ All changes instant
- ✅ Secure multi-user support

**Enjoy secure travel planning! 🇮🇹 ✈️**

---

## Quick Reference Card

```
DEFAULT LOGIN
Username: admin
Password: travel2027

SETTINGS AUTHENTICATION SECTION
📍 Location: Settings tab > Authentication & Security

👥 VIEW USERS - See all usernames
➕ ADD USER - New username + password
✏️ EDIT USERS - Delete existing user
🔑 CHANGE PASSWORD - Update your password
⚠️ RESET TO DEFAULTS - Back to admin/demo
🚪 LOGOUT - Exit application

SESSION INFO
⏰ Duration: 30 days (if Remember me checked)
🌐 Works: Any device, any browser
📱 Mobile: Full support
```

---

**Happy Secure Traveling! 🔐 🇮🇹**
