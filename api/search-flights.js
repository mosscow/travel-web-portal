// api/search-flights.js — Amadeus flight search proxy
// Required env vars: AMADEUS_API_KEY, AMADEUS_API_SECRET
// Optional env var:  AMADEUS_ENV = 'test' (default) | 'production'
//
// Register free at: https://developers.amadeus.com/register
// Test env returns realistic synthetic data — no production approval needed.

const AMADEUS_BASE =
  process.env.AMADEUS_ENV === 'production'
    ? 'https://api.amadeus.com'
    : 'https://test.api.amadeus.com';

// Module-level token cache — persists across warm Lambda invocations
let _tokenCache = null;

async function getAmadeusToken() {
  if (_tokenCache && _tokenCache.expires > Date.now()) return _tokenCache.token;

  const apiKey    = process.env.AMADEUS_API_KEY;
  const apiSecret = process.env.AMADEUS_API_SECRET;
  if (!apiKey || !apiSecret) return null;

  const res = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${encodeURIComponent(apiKey)}&client_secret=${encodeURIComponent(apiSecret)}`
  });

  if (!res.ok) return null;
  const data = await res.json();
  // Cache token with 60-second safety margin before expiry
  _tokenCache = {
    token:   data.access_token,
    expires: Date.now() + (data.expires_in - 60) * 1000
  };
  return _tokenCache.token;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDuration(iso) {
  // 'PT14H35M' → '14h 35m'
  if (!iso) return '';
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return iso;
  const h   = parseInt(m[1] || 0);
  const min = parseInt(m[2] || 0);
  return h ? `${h}h ${min}m` : `${min}m`;
}

function normalizeItinerary(itin, carriers) {
  const segs  = itin.segments;
  const first = segs[0];
  const last  = segs[segs.length - 1];
  return {
    duration:  parseDuration(itin.duration),
    from:      first.departure.iataCode,
    to:        last.arrival.iataCode,
    departAt:  first.departure.at,
    arriveAt:  last.arrival.at,
    stops:     segs.length - 1,
    stopCodes: segs.slice(0, -1).map(s => s.arrival.iataCode),
    segments:  segs.map(s => ({
      from:      s.departure.iataCode,
      to:        s.arrival.iataCode,
      departAt:  s.departure.at,
      arriveAt:  s.arrival.at,
      airline:   carriers?.[s.carrierCode] || s.carrierCode,
      flightNum: s.carrierCode + s.number,
      duration:  parseDuration(s.duration)
    }))
  };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.AMADEUS_API_KEY || !process.env.AMADEUS_API_SECRET) {
    return res.status(503).json({
      error: 'Flight search requires Amadeus API credentials. Add AMADEUS_API_KEY and AMADEUS_API_SECRET to your Vercel environment variables. Register free at developers.amadeus.com.',
      code: 'AMADEUS_NOT_CONFIGURED'
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

  const token = await getAmadeusToken();
  if (!token) {
    return res.status(503).json({ error: 'Could not authenticate with Amadeus API — check your API key and secret.' });
  }

  const params = new URLSearchParams({
    originLocationCode:      from.toUpperCase(),
    destinationLocationCode: to.toUpperCase(),
    departureDate:           departDate,
    adults:                  String(parseInt(adults) || 1),
    travelClass:             (cabinClass || 'ECONOMY').toUpperCase(),
    max:                     String(Math.min(parseInt(max) || 10, 20)),
    currencyCode:            (currencyCode || 'AUD').toUpperCase()
  });
  if (returnDate) params.set('returnDate', returnDate);

  try {
    const searchRes = await fetch(
      `${AMADEUS_BASE}/v2/shopping/flight-offers?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!searchRes.ok) {
      const errBody = await searchRes.json().catch(() => ({}));
      const detail  = errBody.errors?.[0]?.detail || errBody.errors?.[0]?.title || 'Flight search failed';
      return res.status(searchRes.status).json({ error: detail });
    }

    const data     = await searchRes.json();
    const carriers = data.dictionaries?.carriers || {};

    const results = (data.data || []).map(offer => {
      const ob          = offer.itineraries[0];
      const ib          = offer.itineraries[1] || null;
      const firstSeg    = ob.segments[0];
      const carrierCode = offer.validatingAirlineCodes?.[0] || firstSeg.carrierCode;

      return {
        id:          offer.id,
        price:       parseFloat(offer.price.total),
        currency:    offer.price.currency,
        airline:     carriers[carrierCode] || carrierCode,
        airlineCode: carrierCode,
        outbound:    normalizeItinerary(ob, carriers),
        inbound:     ib ? normalizeItinerary(ib, carriers) : null,
        cabinClass,
        adults:      parseInt(adults) || 1
      };
    });

    return res.json({ results, count: results.length });
  } catch (err) {
    return res.status(500).json({ error: 'Flight search error: ' + err.message });
  }
}
