// api/check-alerts.js — Check flight price alerts and send Telegram notifications
//
// Trigger via cron job (cron-job.org) once or twice a day:
//   URL:    https://your-app.vercel.app/api/check-alerts
//   Method: POST
//
// Required env vars:
//   SERPAPI_KEY         — from serpapi.com (free: 100 searches/month)
//   KV_REST_API_URL     — Vercel KV
//   KV_REST_API_TOKEN   — Vercel KV
//
// For Telegram notifications:
//   TELEGRAM_BOT_TOKEN  — from @BotFather
//   TELEGRAM_CHAT_ID    — your personal chat ID

const SERPAPI_BASE = 'https://serpapi.com/search.json';
const KV_URL       = process.env.KV_REST_API_URL;
const KV_TOKEN     = process.env.KV_REST_API_TOKEN;
const ALERTS_KEY   = 'flight-price-alerts';

const CABIN_TO_GF = {
  ECONOMY: '1', PREMIUM_ECONOMY: '2', BUSINESS: '3', FIRST: '4'
};

// ── KV helpers ────────────────────────────────────────────────────────────────

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
  if (!KV_URL || !KV_TOKEN) return;
  try {
    await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'text/plain' },
      body: JSON.stringify(value)
    });
  } catch {}
}

// ── Price check via SerpAPI price_insights ────────────────────────────────────
// Uses price_insights.lowest_price — a single number, no need to parse all flights.

async function getCheapestPrice(alert) {
  if (!process.env.SERPAPI_KEY) return null;

  const params = new URLSearchParams({
    engine:        'google_flights',
    departure_id:  alert.from,
    arrival_id:    alert.to,
    outbound_date: alert.departDate,
    type:          alert.returnDate ? '1' : '2',  // 1=Round trip, 2=One way
    adults:        String(alert.adults || 1),
    travel_class:  CABIN_TO_GF[(alert.cabinClass || 'ECONOMY').toUpperCase()] || '1',
    currency:      alert.currency || 'AUD',
    hl:            'en',
    api_key:       process.env.SERPAPI_KEY
  });
  if (alert.returnDate) params.set('return_date', alert.returnDate);

  try {
    const res  = await fetch(`${SERPAPI_BASE}?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;

    // price_insights.lowest_price is the most reliable single number
    const lowest = data.price_insights?.lowest_price;
    if (lowest) return lowest;

    // Fallback: take cheapest from best_flights + other_flights
    const all = [...(data.best_flights || []), ...(data.other_flights || [])];
    const prices = all.map(f => f.price).filter(p => p != null);
    return prices.length ? Math.min(...prices) : null;
  } catch { return null; }
}

// ── Telegram ──────────────────────────────────────────────────────────────────

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
  if (!alerts.length) return res.json({ checked: 0, triggered: 0, message: 'No alerts' });

  if (!process.env.SERPAPI_KEY) {
    return res.status(503).json({ error: 'SERPAPI_KEY not configured', code: 'SERPAPI_NOT_CONFIGURED' });
  }

  const telegramToken  = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;
  const now            = new Date().toISOString();
  let checked = 0, triggered = 0;

  for (const alert of alerts) {
    const price = await getCheapestPrice(alert);
    checked++;
    alert.lastChecked = now;
    alert.lastPrice   = price;

    if (price !== null && price <= alert.threshold) {
      alert.triggered = true;
      triggered++;

      if (telegramToken && telegramChatId) {
        const dateInfo = alert.returnDate
          ? `Depart ${alert.departDate} · Return ${alert.returnDate}`
          : `Depart ${alert.departDate}`;

        await sendTelegram(telegramToken, telegramChatId,
          `✈️ <b>Flight Price Alert!</b>\n\n` +
          `Route: <b>${alert.from} → ${alert.to}</b>\n` +
          `${dateInfo}\n` +
          `${alert.adults} pax · ${alert.cabinClass}\n\n` +
          `💰 Current price: <b>${alert.currency} ${price.toLocaleString('en-AU')}</b>\n` +
          `🎯 Your threshold: ${alert.currency} ${alert.threshold.toLocaleString('en-AU')}\n\n` +
          `<a href="https://www.google.com/flights">Book on Google Flights →</a>`
        );
      }
    }
  }

  await kvSet(ALERTS_KEY, alerts);
  return res.json({ checked, triggered, timestamp: now });
}
