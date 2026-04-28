// MAPS.JS — Google Maps integration for the section Map tab

// ── API loader (singleton, promise-based) ────────────────────────────────────

let _mapsApiState = 'idle'; // 'idle' | 'loading' | 'ready' | 'error'
let _mapsApiCallbacks = [];
let _currentMapInstance = null;
let _currentMarkers = [];

/**
 * Dynamically load the Google Maps JS API using the key stored in Settings.
 * Calling this multiple times is safe — it only inserts the script once.
 * Returns a Promise that resolves when `google.maps` is available.
 */
function loadGoogleMapsAPI() {
  return new Promise((resolve, reject) => {
    if (_mapsApiState === 'ready')   { resolve(); return; }
    if (_mapsApiState === 'error')   { reject(new Error('load_error')); return; }
    if (_mapsApiState === 'loading') { _mapsApiCallbacks.push({ resolve, reject }); return; }

    const apiKey = localStorage.getItem(CONFIG.STORAGE_KEYS.GOOGLE_MAPS_KEY);
    if (!apiKey) { reject(new Error('no_key')); return; }

    _mapsApiState = 'loading';
    _mapsApiCallbacks.push({ resolve, reject });

    // Global callback invoked by the Maps script once it's ready
    window.__googleMapsReady = function() {
      _mapsApiState = 'ready';
      _mapsApiCallbacks.forEach(cb => cb.resolve());
      _mapsApiCallbacks = [];
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=__googleMapsReady&loading=async`;
    script.async = true;
    script.defer = true;
    script.onerror = function() {
      _mapsApiState = 'error';
      _mapsApiCallbacks.forEach(cb => cb.reject(new Error('load_error')));
      _mapsApiCallbacks = [];
    };
    document.head.appendChild(script);
  });
}

// ── Map state helpers ────────────────────────────────────────────────────────

function clearMarkers() {
  _currentMarkers.forEach(m => m.setMap(null));
  _currentMarkers = [];
}

function showMapMessage(mapEl, html) {
  mapEl.innerHTML = `<div class="map-message">${html}</div>`;
}

// ── Section map init ─────────────────────────────────────────────────────────

/**
 * Initialise (or refresh) the interactive Google Map for the given segment.
 * Called by switchSegmentTab() whenever the Map tab is activated.
 *
 * Geocodes each activity (by location field, falling back to title) and each
 * accommodation (by name), drops colour-coded markers, and fits the viewport
 * to show them all.
 */
async function initSectionMap(segment) {
  const mapEl = document.getElementById('googleMap');
  if (!mapEl) return;

  const apiKey = localStorage.getItem(CONFIG.STORAGE_KEYS.GOOGLE_MAPS_KEY);
  if (!apiKey) {
    showMapMessage(mapEl, `
      <span style="font-size:22px;display:block;margin-bottom:8px;">🗺️</span>
      No Google Maps API key configured.<br>
      <a href="#" onclick="switchHeaderTab(2); return false;"
         style="color:#1976D2;font-size:12px;margin-top:6px;display:inline-block;">
        Go to Settings → Google Maps to add your key →
      </a>`);
    return;
  }

  showMapMessage(mapEl, '<span class="map-spinner"></span> Loading map…');

  try {
    await loadGoogleMapsAPI();
  } catch (e) {
    showMapMessage(mapEl, `
      <span style="font-size:22px;display:block;margin-bottom:8px;">⚠️</span>
      Could not load Google Maps.<br>
      <span style="font-size:12px;color:#888;margin-top:4px;display:block;">
        Check that your API key is valid and the Maps JavaScript API is enabled.
      </span>`);
    return;
  }

  // Clear old markers
  clearMarkers();

  // Wipe the message div so Maps can render into it
  mapEl.innerHTML = '';

  const map = new google.maps.Map(mapEl, {
    zoom: 12,
    center: { lat: 41.9, lng: 12.5 }, // sensible default (Rome) — overridden by fitBounds
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
  });
  _currentMapInstance = map;

  const geocoder = new google.maps.Geocoder();
  const bounds   = new google.maps.LatLngBounds();
  let   placed   = 0;

  // Extract bare city name from section name, e.g. "Rome (Arrival)" → "Rome"
  const city = (segment.name || '').replace(/\(.*?\)/g, '').trim();

  /**
   * Geocode a text string, add a marker, and extend bounds.
   * Returns a Promise so we can await all geocodes together.
   */
  function placeMarker(searchText, label, pinColor, infoTitle) {
    return new Promise(resolve => {
      // Append city hint if the text doesn't already mention it
      const query = searchText +
        (city && !searchText.toLowerCase().includes(city.toLowerCase())
          ? `, ${city}` : '');

      geocoder.geocode({ address: query }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const pos = results[0].geometry.location;

          const marker = new google.maps.Marker({
            position: pos,
            map,
            title:    infoTitle,
            icon: {
              path:        google.maps.SymbolPath.CIRCLE,
              scale:       11,
              fillColor:   pinColor,
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            },
            label: {
              text:       label,
              color:      '#fff',
              fontSize:   '10px',
              fontWeight: 'bold',
            },
          });

          // Info window on click
          const infoWindow = new google.maps.InfoWindow({
            content: `<div style="font-size:13px;font-weight:500;padding:2px 4px;">${infoTitle}</div>`,
          });
          marker.addListener('click', () => infoWindow.open(map, marker));

          _currentMarkers.push(marker);
          bounds.extend(pos);
          placed++;
        }
        resolve();
      });
    });
  }

  // Activity markers — blue (#1976D2), numbered
  const activityPromises = segment.activities.map((a, idx) => {
    const searchText = (a.location && a.location.trim()) ? a.location.trim() : a.title;
    return placeMarker(searchText, String(idx + 1), '#1976D2', a.title);
  });

  // Accommodation markers — purple (#764ba2), hotel icon
  const accomPromises = segment.accommodations.map(acc =>
    placeMarker(acc.name, '★', '#764ba2', acc.name)
  );

  await Promise.all([...activityPromises, ...accomPromises]);

  if (placed > 0) {
    map.fitBounds(bounds);
    // Don't over-zoom for a single pin
    const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
      if (map.getZoom() > 16) map.setZoom(16);
    });
  } else if (city) {
    // No pins found — at least centre on the city
    geocoder.geocode({ address: city }, (results, status) => {
      if (status === 'OK' && results[0]) {
        map.setCenter(results[0].geometry.location);
        map.setZoom(12);
      }
    });
  }
}

// ── Settings test helper ─────────────────────────────────────────────────────

/**
 * Test the stored Google Maps key by attempting to load the API.
 * Called by the "Test" button in the Google Maps settings card.
 */
async function testGoogleMapsKey() {
  const msgEl = document.getElementById('googleMapsMessage');
  if (!msgEl) return;

  const key = document.getElementById('googleMapsKey')
    ? document.getElementById('googleMapsKey').value.trim()
    : localStorage.getItem(CONFIG.STORAGE_KEYS.GOOGLE_MAPS_KEY);

  if (!key) {
    msgEl.innerHTML = showMessage('Enter and save an API key first.', 'error');
    return;
  }
  if (!key.startsWith('AIza')) {
    msgEl.innerHTML = showMessage('That doesn\'t look like a valid Maps API key (should start with "AIza").', 'error');
    return;
  }

  msgEl.innerHTML = showMessage('Testing key…', 'info');

  // Use the REST Geocoding API endpoint — it validates the key without needing
  // the full JS SDK loaded and works regardless of which tab is active.
  try {
    const res  = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=Rome,Italy&key=${encodeURIComponent(key)}`
    );
    const data = await res.json();

    if (data.status === 'OK') {
      msgEl.innerHTML = showMessage('✅ API key is valid and working!', 'success');
    } else if (data.status === 'REQUEST_DENIED') {
      const detail = data.error_message || 'Key rejected by Google.';
      msgEl.innerHTML = showMessage(`❌ Key denied: ${detail}`, 'error');
    } else {
      msgEl.innerHTML = showMessage(`⚠️ Unexpected response: ${data.status}`, 'error');
    }
  } catch (e) {
    msgEl.innerHTML = showMessage('Network error — could not reach Google Maps API.', 'error');
  }
}

console.log('✅ Maps module loaded');
