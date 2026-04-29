// api/check-alerts.js — Check flight price alerts and send Telegram notifications
//
// Call this endpoint from a cron job (e.g. cron-job.org) once or twice a day:
//   URL:    https://your-app.vercel.app/api/check-alerts
//   Method: POST
//
// Required env vars:
//   KIWI_API_KEY        — from tequila.kiwi.com (free registration)
//
// Required for Telegram notifications:
//   TELEGRAM_BOT_TOKEN  — from @BotFather on Telegram
//   TELEGRAM_CHAT_ID    — your personal chat ID

const KIWI_BASE  = 'https://api.tequila.kiwi.com';
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

// ── Date helpers ──────────────────────────────────────────────────────────────

/** YYYY-MM-DD → DD/MM/YYYY */
function toKiwiDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// ── Search cheapest price via Kiwi.com ────────────────────────────────────────

const CABIN_TO_KIWI = {
  ECONOMY: 'M', PREMIUM_ECONOMY: 'W', BUSINESS: 'C', FIRST: 'F'
};

async function getCheapestPrice(alert) {
  const apiKey = process.env.KIWI_API_KEY;
  if (!apiKey) return null;

  const kiwiDepart = toKiwiDate(alert.departDate);
  const kiwiReturn = alert.returnDate ? toKiwiDate(alert.returnDate) : null;
  const kiwiCabin  = CABIN_TO_KIWI[(alert.cabinClass || 'ECONOMY').toUpperCase()] || 'M';

  const params = new URLSearchParams({
    fly_from:        alert.from,
    fly_to:          alert.to,
    date_from:       kiwiDepart,
    date_to:         kiwiDepart,
    adults:          String(alert.adults || 1),
    selected_cabins: kiwiCabin,
    curr:            alert.currency || 'AUD',
    limit:           '3',
    sort:            'price'
  });
  if (kiwiReturn) {
    params.set('return_from', kiwiReturn);
    params.set('return_to',   kiwiReturn);
  }

  try {
    const res = await fetch(`${KIWI_BASE}/v2/search?${params}`, {
      headers: { apikey: apiKey }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0]?.price ?? null;
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

  if (!process.env.KIWI_API_KEY) {
    return res.status(503).json({
      error: 'Kiwi.com API key not configured — cannot check prices',
      code: 'KIWI_NOT_CONFIGURED'
    });
  }

  const telegramToken  = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  let checked   = 0;
  let triggered = 0;
  const now     = new Date().toISOString();

  for (const alert of alerts) {
    const price = await getCheapestPrice(alert);
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

        await sendTelegram(telegramToken, telegramChatId,
          `✈️ <b>Flight Price Alert!</b>\n\n` +
          `Route: <b>${route}</b>\n` +
          `${dateInfo}\n` +
          `${alert.adults} passenger${alert.adults > 1 ? 's' : ''} · ${alert.cabinClass}\n\n` +
          `💰 Current price: <b>${alert.currency} ${price.toLocaleString('en-AU')}</b>\n` +
          `🎯 Your threshold: ${alert.currency} ${alert.threshold.toLocaleString('en-AU')}\n\n` +
          `<a href="https://www.google.com/flights">Search on Google Flights →</a>`
        );
      }
    }
  }

  await kvSet(ALERTS_KEY, alerts);

  return res.json({ checked, triggered, timestamp: now });
}
