// api/check-alerts.js — Check flight price alerts and send Telegram notifications
//
// Call this endpoint from a cron job (e.g. cron-job.org) once or twice a day:
//   URL:    https://your-app.vercel.app/api/check-alerts
//   Method: POST
//
// Required env vars (same as search-flights.js):
//   AMADEUS_API_KEY, AMADEUS_API_SECRET
//
// Required env vars for Telegram notifications:
//   TELEGRAM_BOT_TOKEN  — from @BotFather on Telegram
//   TELEGRAM_CHAT_ID    — your personal chat ID (send /start to your bot, then check getUpdates)
//
// Optional:
//   AMADEUS_ENV         — 'test' (default) | 'production'

const AMADEUS_BASE =
  process.env.AMADEUS_ENV === 'production'
    ? 'https://api.amadeus.com'
    : 'https://test.api.amadeus.com';

const KV_URL     = process.env.KV_REST_API_URL;
const KV_TOKEN   = process.env.KV_REST_API_TOKEN;
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
  if (!KV_URL || !KV_TOKEN) return;
  try {
    await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'text/plain' },
      body: JSON.stringify(value)
    });
  } catch {}
}

// ── Amadeus token (re-acquired each invocation — no cross-request cache here) ─

async function getAmadeusToken() {
  const apiKey    = process.env.AMADEUS_API_KEY;
  const apiSecret = process.env.AMADEUS_API_SECRET;
  if (!apiKey || !apiSecret) return null;

  try {
    const res = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${encodeURIComponent(apiKey)}&client_secret=${encodeURIComponent(apiSecret)}`
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

// ── Search for cheapest price for a given alert ───────────────────────────────

async function getCheapestPrice(alert, token) {
  const params = new URLSearchParams({
    originLocationCode:      alert.from,
    destinationLocationCode: alert.to,
    departureDate:           alert.departDate,
    adults:                  String(alert.adults || 1),
    travelClass:             alert.cabinClass || 'ECONOMY',
    max:                     '5',
    currencyCode:            alert.currency || 'AUD'
  });
  if (alert.returnDate) params.set('returnDate', alert.returnDate);

  try {
    const res = await fetch(
      `${AMADEUS_BASE}/v2/shopping/flight-offers?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.data?.length) return null;
    // Amadeus returns offers sorted by price — first is cheapest
    return parseFloat(data.data[0].price.total);
  } catch {
    return null;
  }
}

// ── Telegram notification ─────────────────────────────────────────────────────

async function sendTelegram(botToken, chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
  } catch {}
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!KV_URL || !KV_TOKEN) {
    return res.status(503).json({ error: 'KV not configured', code: 'KV_NOT_CONFIGURED' });
  }

  const alerts = await kvGet(ALERTS_KEY) || [];
  if (alerts.length === 0) {
    return res.json({ checked: 0, triggered: 0, message: 'No alerts configured' });
  }

  if (!process.env.AMADEUS_API_KEY) {
    return res.status(503).json({
      error: 'Amadeus not configured — cannot check prices',
      code: 'AMADEUS_NOT_CONFIGURED'
    });
  }

  const token = await getAmadeusToken();
  if (!token) {
    return res.status(503).json({ error: 'Could not authenticate with Amadeus API' });
  }

  const telegramToken  = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  let checked   = 0;
  let triggered = 0;
  const now     = new Date().toISOString();

  for (const alert of alerts) {
    const price = await getCheapestPrice(alert, token);
    checked++;

    alert.lastChecked = now;
    alert.lastPrice   = price;

    if (price !== null && price <= alert.threshold) {
      alert.triggered = true;
      triggered++;

      if (telegramToken && telegramChatId) {
        const route    = `${alert.from} → ${alert.to}`;
        const dateInfo = alert.returnDate
          ? `Depart ${alert.departDate} · Return ${alert.returnDate}`
          : `Depart ${alert.departDate}`;
        const msg =
          `✈️ <b>Flight Price Alert!</b>\n\n` +
          `Route: <b>${route}</b>\n` +
          `${dateInfo}\n` +
          `${alert.adults} passenger${alert.adults > 1 ? 's' : ''} · ${alert.cabinClass}\n\n` +
          `💰 Current price: <b>${alert.currency} ${price.toLocaleString('en-AU')}</b>\n` +
          `🎯 Your threshold: ${alert.currency} ${alert.threshold.toLocaleString('en-AU')}\n\n` +
          `<a href="https://www.google.com/flights">Search on Google Flights →</a>`;

        await sendTelegram(telegramToken, telegramChatId, msg);
      }
    }
  }

  // Persist updated alert states
  await kvSet(ALERTS_KEY, alerts);

  return res.json({ checked, triggered, timestamp: now });
}
