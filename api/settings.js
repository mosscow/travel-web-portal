// api/settings.js — Cross-device portal settings stored in Vercel KV
// GET  → returns all saved settings (values for admin fields)
// POST → saves/merges settings object

const KV_URL       = process.env.KV_REST_API_URL;
const KV_TOKEN     = process.env.KV_REST_API_TOKEN;
const SETTINGS_KEY = 'portal-settings';

async function kvGet(key) {
  if (!KV_URL || !KV_TOKEN) return null;
  try {
    const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });
    const { result } = await res.json();
    return result ? JSON.parse(result) : null;
  } catch { return null; }
}

async function kvSet(key, value) {
  if (!KV_URL || !KV_TOKEN) return false;
  try {
    await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'text/plain' },
      body: JSON.stringify(value)
    });
    return true;
  } catch { return false; }
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (!KV_URL || !KV_TOKEN) {
    // KV not set up — tell client so it can fall back to localStorage only
    return res.status(503).json({ error: 'KV not configured', code: 'KV_NOT_CONFIGURED' });
  }

  // GET — return stored settings
  if (req.method === 'GET') {
    const settings = await kvGet(SETTINGS_KEY) || {};
    return res.json({ settings });
  }

  // POST — merge incoming keys into stored settings
  if (req.method === 'POST') {
    const incoming = req.body || {};
    // Strip any null/undefined values before merging
    const patch = Object.fromEntries(
      Object.entries(incoming).filter(([, v]) => v != null && v !== '')
    );
    const existing = await kvGet(SETTINGS_KEY) || {};
    const updated  = { ...existing, ...patch };
    await kvSet(SETTINGS_KEY, updated);
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
