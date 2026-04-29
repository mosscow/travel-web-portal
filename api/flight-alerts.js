// api/flight-alerts.js — CRUD for flight price alerts stored in Vercel KV
// GET    → list all alerts
// POST   → create alert   { from, to, departDate, returnDate?, adults, cabinClass, threshold, currency }
// DELETE → remove alert   { id }

const KV_URL    = process.env.KV_REST_API_URL;
const KV_TOKEN  = process.env.KV_REST_API_TOKEN;
const ALERTS_KEY = 'flight-price-alerts';

// ── KV helpers ────────────────────────────────────────────────────────────────

async function kvGet(key) {
  if (!KV_URL || !KV_TOKEN) return null;
  try {
    const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });
    const { result } = await res.json();
    return result ? JSON.parse(result) : null;
  } catch {
    return null;
  }
}

async function kvSet(key, value) {
  if (!KV_URL || !KV_TOKEN) return false;
  try {
    await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${KV_TOKEN}`,
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(value)
    });
    return true;
  } catch {
    return false;
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (!KV_URL || !KV_TOKEN) {
    return res.status(503).json({
      error: 'Price alerts require Vercel KV. Configure KV_REST_API_URL and KV_REST_API_TOKEN in your Vercel project.',
      code: 'KV_NOT_CONFIGURED'
    });
  }

  // ── GET — list all alerts ─────────────────────────────────────────────────
  if (req.method === 'GET') {
    const alerts = await kvGet(ALERTS_KEY) || [];
    return res.json({ alerts });
  }

  // ── POST — create a new alert ─────────────────────────────────────────────
  if (req.method === 'POST') {
    const { from, to, departDate, returnDate, adults, cabinClass, threshold, currency } = req.body || {};

    if (!from || !to || !departDate || threshold == null) {
      return res.status(400).json({ error: 'from, to, departDate, and threshold are required' });
    }

    const alerts = await kvGet(ALERTS_KEY) || [];

    const alert = {
      id:           Date.now().toString(),
      from:         from.toUpperCase(),
      to:           to.toUpperCase(),
      departDate,
      returnDate:   returnDate || null,
      adults:       parseInt(adults) || 1,
      cabinClass:   (cabinClass || 'ECONOMY').toUpperCase(),
      threshold:    parseFloat(threshold),
      currency:     (currency || 'AUD').toUpperCase(),
      createdAt:    new Date().toISOString(),
      lastChecked:  null,
      lastPrice:    null,
      triggered:    false
    };

    alerts.push(alert);
    await kvSet(ALERTS_KEY, alerts);
    return res.json({ success: true, alert });
  }

  // ── DELETE — remove an alert by id ───────────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id is required' });

    const alerts  = await kvGet(ALERTS_KEY) || [];
    const updated = alerts.filter(a => a.id !== String(id));
    await kvSet(ALERTS_KEY, updated);
    return res.json({ success: true, removed: alerts.length - updated.length });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
