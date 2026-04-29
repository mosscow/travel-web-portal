// api/search-flights.js — Kiwi.com Tequila flight search proxy
// Required env var: KIWI_API_KEY
//
// Register free at: https://tequila.kiwi.com/portal/login
// Returns real live flight prices (not synthetic test data).

const KIWI_BASE = 'https://api.tequila.kiwi.com';

// Amadeus cabin codes → Kiwi cabin codes
const CABIN_TO_KIWI = {
  'ECONOMY':         'M',
  'PREMIUM_ECONOMY': 'W',
  'BUSINESS':        'C',
  'FIRST':           'F'
};

// Common airline IATA code → name (best-effort; falls back to code)
const AIRLINE_NAMES = {
  QF:'Qantas', EK:'Emirates', SQ:'Singapore Airlines', CX:'Cathay Pacific',
  TG:'Thai Airways', MH:'Malaysia Airlines', GA:'Garuda Indonesia',
  AI:'Air India', BA:'British Airways', LH:'Lufthansa', AF:'Air France',
  KL:'KLM', IB:'Iberia', AY:'Finnair', SK:'SAS', OS:'Austrian Airlines',
  LX:'Swiss', TP:'TAP Air Portugal', AZ:'ITA Airways', FR:'Ryanair',
  U2:'easyJet', W6:'Wizz Air', VY:'Vueling', D8:'Norwegian',
  UA:'United Airlines', AA:'American Airlines', DL:'Delta Air Lines',
  WN:'Southwest', AS:'Alaska Airlines', B6:'JetBlue',
  AC:'Air Canada', WS:'WestJet',
  NH:'ANA', JL:'Japan Airlines', MU:'China Eastern', CZ:'China Southern',
  CA:'Air China', KE:'Korean Air', OZ:'Asiana Airlines',
  TK:'Turkish Airlines', MS:'EgyptAir', ET:'Ethiopian Airlines',
  EY:'Etihad Airways', GF:'Gulf Air', QR:'Qatar Airways', WY:'Oman Air',
  VA:'Virgin Australia', JQ:'Jetstar', FD:'Thai AirAsia', AK:'AirAsia',
  NZ:'Air New Zealand', FJ:'Fiji Airways'
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** YYYY-MM-DD → DD/MM/YYYY (Kiwi date format) */
function toKiwiDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

/** Duration in seconds → '14h 35m' */
function fmtDuration(secs) {
  if (!secs) return '';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

/** Derive duration from ISO date strings when Kiwi doesn't supply seconds */
function legDuration(departAt, arriveAt) {
  try {
    return fmtDuration((new Date(arriveAt) - new Date(departAt)) / 1000);
  } catch {
    return '';
  }
}

function buildLeg(segs) {
  if (!segs.length) return null;
  const first = segs[0];
  const last  = segs[segs.length - 1];
  return {
    from:      first.flyFrom,
    to:        last.flyTo,
    departAt:  first.local_departure,
    arriveAt:  last.local_arrival,
    duration:  legDuration(first.local_departure, last.local_arrival),
    stops:     segs.length - 1,
    stopCodes: segs.slice(0, -1).map(s => s.flyTo),
    segments:  segs.map(s => ({
      from:      s.flyFrom,
      to:        s.flyTo,
      departAt:  s.local_departure,
      arriveAt:  s.local_arrival,
      airline:   AIRLINE_NAMES[s.airline] || s.airline,
      flightNum: s.airline + s.flight_no,
      duration:  legDuration(s.local_departure, s.local_arrival)
    }))
  };
}

function normalizeOffer(offer, currency, adults, cabinClass) {
  const route   = offer.route || [];
  // Kiwi marks each segment: return=0 outbound, return=1 inbound
  const outSegs = route.filter(s => s.return === 0);
  const inSegs  = route.filter(s => s.return === 1);

  const primaryCode = (offer.airlines || [])[0] || outSegs[0]?.airline || '?';

  return {
    id:          offer.id,
    price:       offer.price,
    currency,
    airline:     AIRLINE_NAMES[primaryCode] || primaryCode,
    airlineCode: primaryCode,
    outbound:    buildLeg(outSegs.length ? outSegs : route),
    inbound:     inSegs.length ? buildLeg(inSegs) : null,
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

  if (!process.env.KIWI_API_KEY) {
    return res.status(503).json({
      error: 'Flight search requires a Kiwi.com API key. Add KIWI_API_KEY to your Vercel environment variables. Register free at tequila.kiwi.com.',
      code: 'KIWI_NOT_CONFIGURED'
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

  const kiwiDepart = toKiwiDate(departDate);
  const kiwiReturn = returnDate ? toKiwiDate(returnDate) : null;
  const kiwiCabin  = CABIN_TO_KIWI[(cabinClass || 'ECONOMY').toUpperCase()] || 'M';
  const cur        = (currencyCode || 'AUD').toUpperCase();

  const params = new URLSearchParams({
    fly_from:        from.toUpperCase(),
    fly_to:          to.toUpperCase(),
    date_from:       kiwiDepart,
    date_to:         kiwiDepart,       // fixed departure date
    adults:          String(parseInt(adults) || 1),
    selected_cabins: kiwiCabin,
    curr:            cur,
    limit:           String(Math.min(parseInt(max) || 10, 20)),
    sort:            'price',
    max_stopovers:   '3'
  });
  if (kiwiReturn) {
    params.set('return_from', kiwiReturn);
    params.set('return_to',   kiwiReturn);
  }

  try {
    const resp = await fetch(`${KIWI_BASE}/v2/search?${params}`, {
      headers: { apikey: process.env.KIWI_API_KEY }
    });

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      return res.status(resp.status).json({
        error: body.message || body.error || `Kiwi API error ${resp.status}`
      });
    }

    const data    = await resp.json();
    const results = (data.data || []).map(o =>
      normalizeOffer(o, cur, parseInt(adults) || 1, cabinClass)
    );

    return res.json({ results, count: results.length });
  } catch (err) {
    return res.status(500).json({ error: 'Flight search error: ' + err.message });
  }
}
