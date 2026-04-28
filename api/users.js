// api/users.js — Server-side user management backed by Vercel KV
//
// Vercel KV stores credentials centrally so all devices see the same user list.
// Set these environment variables in your Vercel project dashboard:
//   KV_REST_API_URL   — from the KV store "REST API" tab
//   KV_REST_API_TOKEN — from the KV store "REST API" tab
//   AUTH_SALT         — any random string (e.g. openssl rand -hex 32)

import { createHash } from 'node:crypto';

const KV_URL   = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const SALT     = process.env.AUTH_SALT || 'travel-portal-fallback-salt';
const USERS_KEY = 'portal-users';

// ── KV helpers (Vercel KV REST API — no SDK needed) ──────────────────────────

async function kvGet(key) {
  if (!KV_URL || !KV_TOKEN) return null;
  try {
    const res = await fetch(`${KV_URL}/get/${key}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });
    const { result } = await res.json();
    return result ? JSON.parse(result) : null;
  } catch {
    return null;
  }
}

async function kvSet(key, value) {
  if (!KV_URL || !KV_TOKEN) return;
  await fetch(`${KV_URL}/set/${key}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'text/plain'
    },
    body: JSON.stringify(value)   // store as a JSON string
  });
}

// ── Password hashing ─────────────────────────────────────────────────────────

function hashPassword(password) {
  return createHash('sha256').update(password + SALT).digest('hex');
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  // KV not configured — tell client to fall back to localStorage auth
  if (!KV_URL || !KV_TOKEN) {
    return res.status(503).json({
      error: 'User storage not configured. Please set up Vercel KV.',
      code: 'KV_NOT_CONFIGURED'
    });
  }

  // ── GET — list users (no passwords) ────────────────────────────────────────
  if (req.method === 'GET') {
    const users = await kvGet(USERS_KEY) || [];
    return res.json({
      users: users.map(u => ({
        username:  u.username,
        role:      u.role || 'user',
        createdAt: u.createdAt
      }))
    });
  }

  // ── POST — action-based writes ──────────────────────────────────────────────
  if (req.method === 'POST') {
    const body   = req.body || {};
    const action = body.action;

    // Authenticate
    if (action === 'auth') {
      const { username, password } = body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      const users = await kvGet(USERS_KEY) || [];
      const user  = users.find(
        u => u.username === username && u.passwordHash === hashPassword(password)
      );
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid username or password' });
      }
      return res.json({ success: true, username: user.username, role: user.role || 'user' });
    }

    // ── Register (open self-registration, no admin required) ──────────────────
    // Used by setup.html. First account gets 'admin', subsequent get 'user'.
    if (action === 'register') {
      const { username, password } = body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      if (username.length < 2 || !/^[a-z0-9_]+$/.test(username)) {
        return res.status(400).json({ error: 'Username must be 2+ lowercase letters, numbers or underscores' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      const users = await kvGet(USERS_KEY) || [];
      if (users.find(u => u.username === username)) {
        return res.status(409).json({ error: `Username "${username}" is already taken` });
      }
      const role = users.length === 0 ? 'admin' : 'user';
      users.push({ username, passwordHash: hashPassword(password), role, createdAt: new Date().toISOString() });
      await kvSet(USERS_KEY, users);
      return res.json({ success: true, role });
    }

    // ── Sync (migrate a localStorage user to KV silently on login) ────────────
    // Upserts the user into KV so they become available cross-device.
    // No admin check: the caller has already authenticated locally.
    if (action === 'sync') {
      const { username, password } = body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      const users = await kvGet(USERS_KEY) || [];
      if (users.find(u => u.username === username)) {
        return res.json({ success: true, synced: false, reason: 'already_exists' });
      }
      const role = users.length === 0 ? 'admin' : 'user';
      users.push({ username, passwordHash: hashPassword(password), role, createdAt: new Date().toISOString() });
      await kvSet(USERS_KEY, users);
      console.log(`Synced localStorage user "${username}" to KV with role "${role}"`);
      return res.json({ success: true, synced: true, role });
    }

    // Create user (admin-only, used by Settings)
    if (action === 'create') {
      const { username, password, requestingUser } = body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      if (username.length < 2 || !/^[a-z0-9_]+$/.test(username)) {
        return res.status(400).json({ error: 'Username must be 2+ lowercase letters, numbers or underscores' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      const users = await kvGet(USERS_KEY) || [];

      // First user can always be created (bootstrap). After that, require admin.
      if (users.length > 0) {
        const requester = requestingUser ? users.find(u => u.username === requestingUser) : null;
        if (!requester || requester.role !== 'admin') {
          return res.status(403).json({ error: 'Only admins can create new users' });
        }
      }

      if (users.find(u => u.username === username)) {
        return res.status(409).json({ error: `Username "${username}" is already taken` });
      }
      // First user automatically becomes admin
      const role = users.length === 0 ? 'admin' : 'user';
      users.push({
        username,
        passwordHash: hashPassword(password),
        role,
        createdAt: new Date().toISOString()
      });
      await kvSet(USERS_KEY, users);
      return res.json({ success: true, role });
    }

    // Change password
    if (action === 'change-password') {
      const { username, currentPassword, newPassword } = body;
      const users = await kvGet(USERS_KEY) || [];
      const user  = users.find(u => u.username === username);
      if (!user || user.passwordHash !== hashPassword(currentPassword)) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }
      user.passwordHash = hashPassword(newPassword);
      await kvSet(USERS_KEY, users);
      return res.json({ success: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  }

  // ── DELETE — remove a user (admin only) ────────────────────────────────────
  if (req.method === 'DELETE') {
    const { username, requestingUser } = req.body || {};
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    const users = await kvGet(USERS_KEY) || [];

    // Verify the requester is an admin
    const requester = requestingUser ? users.find(u => u.username === requestingUser) : null;
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete users' });
    }
    if (username === requestingUser) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const updated = users.filter(u => u.username !== username);
    if (updated.length === users.length) {
      return res.status(404).json({ error: `User "${username}" not found` });
    }
    await kvSet(USERS_KEY, updated);
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
