// api/search-flights.js — Google Flights search via SerpAPI
// Required env var: SERPAPI_KEY
//
// Register free at: https://serpapi.com (100 searches/month free, no credit card)
// Returns real live Google Flights prices.

const SERPAPI_BASE = 'https://serpapi.com/search.json';

// Cabin class numbers used by Google Flights / SerpAPI
const CABIN_TO_GF = {
  'ECONOMY':         '1',
  'PREMIUM_ECONOMY': '2',
  'BUSINESS':        '3',
  'FIRST':           '4'
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Duration in minutes → '14h 35m' */
function fmtMins(mins) {
  if (!mins) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

/**
 * SerpAPI returns time as "2026-06-01 12:00" — convert to ISO-style
 * so our existing date arithmetic in the UI works correctly.
 */
function toIso(t) {
  return t ? t.replace(' ', 'T') + ':00' : '';
}

/** Build a leg object from a flat array of SerpAPI segment objects */
function buildLeg(segs, totalDuration) {
  if (!segs || !segs.length) return null;
  const first = segs[0];
  const last  = segs[segs.length - 1];

  return {
    from:      first.departure_airport?.id   || '?',
    to:        last.arrival_airport?.id      || '?',
    departAt:  toIso(first.departure_airport?.time),
    arriveAt:  toIso(last.arrival_airport?.time),
    duration:  fmtMins(totalDuration || segs.reduce((s, f) => s + (f.duration || 0), 0)),
    stops:     segs.length - 1,
    stopCodes: segs.slice(0, -1).map(s => s.arrival_airport?.id).filter(Boolean),
    segments:  segs.map(s => ({
      from:      s.departure_airport?.id,
      to:        s.arrival_airport?.id,
      departAt:  toIso(s.departure_airport?.time),
      arriveAt:  toIso(s.arrival_airport?.time),
      airline:   s.airline,
      flightNum: s.flight_number,
      duration:  fmtMins(s.duration)
    }))
  };
}

function normalizeOffer(f, currency, adults, cabinClass) {
  const segs       = f.flights || [];
  const firstSeg   = segs[0] || {};
  const airlineCode = (firstSeg.flight_number || '').split(' ')[0] || '??';

  return {
    id:          f.booking_token || (`serp-${Date.now()}-${Math.random()}`),
    price:       f.price,
    currency,
    airline:     firstSeg.airline || airlineCode,
    airlineCode,
    airlineLogo: firstSeg.airline_logo || null,
    outbound:    buildLeg(segs, f.total_duration),
    inbound:     null,   // SerpAPI one-way; round-trip handled per-leg by Google
    cabinClass,
    adults
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.SERPAPI_KEY) {
    return res.status(503).json({
      error: 'Flight search requires a SerpAPI key. Add SERPAPI_KEY to your Vercel environment variables. Register free (100 searches/month) at serpapi.com.',
      code: 'SERPAPI_NOT_CONFIGURED'
    });
  }

  const {
    from, to, departDate, returnDate,
    adults = 1, cabinClass = 'ECONOMY',
    currencyCode, max = 10
  } = req.body || {};

  if (!from || !to || !departDate) {
    return res.status(400).json({ error: 'from, to, and departDate are required' });
  }

  const cur = (currencyCode || 'AUD').toUpperCase();

  const params = new URLSearchParams({
    engine:        'google_flights',
    departure_id:  from.toUpperCase(),
    arrival_id:    to.toUpperCase(),
    outbound_date: departDate,
    type:          returnDate ? '1' : '2',   // 1=Round trip, 2=One way
    adults:        String(parseInt(adults) || 1),
    travel_class:  CABIN_TO_GF[(cabinClass || 'ECONOMY').toUpperCase()] || '1',
    currency:      cur,
    hl:            'en',
    api_key:       process.env.SERPAPI_KEY
  });
  if (returnDate) params.set('return_date', returnDate);

  try {
    const resp = await fetch(`${SERPAPI_BASE}?${params}`);

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      return res.status(resp.status).json({
        error: body.error || `SerpAPI error ${resp.status}`
      });
    }

    const data = await resp.json();

    if (data.error) {
      return res.status(400).json({ error: data.error });
    }

    // Merge best_flights (featured) + other_flights, cap at max
    const raw     = [...(data.best_flights || []), ...(data.other_flights || [])];
    const results = raw.slice(0, parseInt(max) || 10).map(f =>
      normalizeOffer(f, cur, parseInt(adults) || 1, cabinClass)
    );

    // Include price insights for context (lowest / typical range)
    const insights = data.price_insights || null;

    return res.json({ results, count: results.length, insights });
  } catch (err) {
    return res.status(500).json({ error: 'Flight search error: ' + err.message });
  }
}
