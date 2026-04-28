// MAPS.JS — Google Maps integration for the section Map tab

// ── API loader (singleton, promise-based) ────────────────────────────────────

let _mapsApiState = 'idle'; // 'idle' | 'loading' | 'ready' | 'error'
let _mapsApiCallbacks = [];
let _currentMapInstance = null;
let _currentMarkers = [];       // all markers (for clearMarkers)
let _activityMarkers = {};      // { activityIdx: marker } — for focusMapMarker
let _accomMarkers = {};         // { accomIdx:    marker } — for focusMapMarker
let _pendingFocusType = null;   // set before map load to auto-focus after
let _pendingFocusIdx  = null;

/**
 * Dynamically load the Google Maps JS API (with Places library) using the key
 * stored in Settings.  Calling this multiple times is safe — it only inserts
 * the script once.  Returns a Promise that resolves when `google.maps` is ready.
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

    window.__googleMapsReady = function() {
      _mapsApiState = 'ready';
      _mapsApiCallbacks.forEach(cb => cb.resolve());
      _mapsApiCallbacks = [];
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=__googleMapsReady&libraries=places&loading=async`;
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
  _currentMarkers   = [];
  _activityMarkers  = {};
  _accomMarkers     = {};
}

function showMapMessage(mapEl, html) {
  mapEl.innerHTML = `<div class="map-message">${html}</div>`;
}

// ── Focus a specific map pin ─────────────────────────────────────────────────

/**
 * Centre the map on a specific marker and open its info window.
 * type: 'activity' | 'accommodation'
 * idx:  the index of the item in its respective array
 */
function focusMapMarker(type, idx) {
  if (!_currentMapInstance) {
    // Map not loaded yet — store as pending so initSectionMap can fire it after load
    _pendingFocusType = type;
    _pendingFocusIdx  = idx;
    return;
  }
  const marker = type === 'activity' ? _activityMarkers[idx] : _accomMarkers[idx];
  if (!marker) return;

  _currentMapInstance.panTo(marker.getPosition());
  _currentMapInstance.setZoom(16);
  google.maps.event.trigger(marker, 'click');

  // Highlight sidebar row
  document.querySelectorAll('.map-item').forEach(el => el.classList.remove('active'));
  const rowEl = document.getElementById(`map-item-${type}-${idx}`);
  if (rowEl) rowEl.classList.add('active');
}

// ── Section map init ─────────────────────────────────────────────────────────

/**
 * Initialise (or refresh) the interactive Google Map for the given segment.
 * Called by switchSegmentTab() whenever the Map tab is activated.
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

  clearMarkers();
  mapEl.innerHTML = '';

  let map;
  try {
    map = new google.maps.Map(mapEl, {
      zoom: 12,
      center: { lat: 41.9, lng: 12.5 },
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });
  } catch (e) {
    const isNotActivated = e.message && e.message.includes('ApiNotActivated');
    showMapMessage(mapEl, `
      <span style="font-size:22px;display:block;margin-bottom:8px;">⚠️</span>
      ${isNotActivated
        ? 'Maps JavaScript API not enabled.<br><span style="font-size:12px;color:#888;margin-top:6px;display:block;">Go to <strong>Google Cloud Console → APIs &amp; Services → Library</strong>, enable <em>Maps JavaScript API</em> and <em>Geocoding API</em>, then reload.</span>'
        : 'Failed to start Google Maps: ' + e.message}
    `);
    _mapsApiState = 'idle';
    return;
  }
  _currentMapInstance = map;

  const geocoder = new google.maps.Geocoder();
  const bounds   = new google.maps.LatLngBounds();
  let   placed   = 0;

  const city = (segment.name || '').replace(/\(.*?\)/g, '').trim();

  function placeMarker(searchText, label, pinColor, infoTitle, markerStore, storeKey) {
    return new Promise(resolve => {
      const query = searchText +
        (city && !searchText.toLowerCase().includes(city.toLowerCase())
          ? `, ${city}` : '');

      geocoder.geocode({ address: query }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const pos = results[0].geometry.location;

          const marker = new google.maps.Marker({
            position: pos,
            map,
            title: infoTitle,
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

          const infoWindow = new google.maps.InfoWindow({
            content: `<div style="font-size:13px;font-weight:500;padding:2px 4px;">${infoTitle}</div>`,
          });
          marker.addListener('click', () => infoWindow.open(map, marker));

          _currentMarkers.push(marker);
          if (markerStore !== null) markerStore[storeKey] = marker;
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
    return placeMarker(searchText, String(idx + 1), '#1976D2', a.title, _activityMarkers, idx);
  });

  // Accommodation markers — purple (#764ba2), star
  const accomPromises = segment.accommodations.map((acc, idx) =>
    placeMarker(acc.location || acc.name, '★', '#764ba2', acc.name, _accomMarkers, idx)
  );

  await Promise.all([...activityPromises, ...accomPromises]);

  if (placed > 0) {
    map.fitBounds(bounds);
    google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
      if (map.getZoom() > 16) map.setZoom(16);

      // Fire any pending focus from "View on map" button
      if (_pendingFocusType !== null) {
        const t = _pendingFocusType, i = _pendingFocusIdx;
        _pendingFocusType = null;
        _pendingFocusIdx  = null;
        setTimeout(() => focusMapMarker(t, i), 200);
      }
    });
  } else if (city) {
    geocoder.geocode({ address: city }, (results, status) => {
      if (status === 'OK' && results[0]) {
        map.setCenter(results[0].geometry.location);
        map.setZoom(12);
      }
    });
  }
}

// ── Location search autocomplete ─────────────────────────────────────────────

let _locationSearchTimers = {};

/**
 * Called oninput on any location field.
 * entityType: 'activity' | 'accommodation'
 * entityIdx:  index in the segment array
 */
function locationSearchInput(inputEl, entityType, entityIdx) {
  const dropId = `loc-drop-${entityType}-${entityIdx}`;
  const dropEl = document.getElementById(dropId);
  const query  = inputEl.value.trim();

  clearTimeout(_locationSearchTimers[dropId]);

  if (query.length < 3) {
    if (dropEl) { dropEl.innerHTML = ''; dropEl.style.display = 'none'; }
    return;
  }

  _locationSearchTimers[dropId] = setTimeout(() => {
    geocodeSearch(query, dropEl, inputEl, entityType, entityIdx);
  }, 350);
}

async function geocodeSearch(query, dropEl, inputEl, entityType, entityIdx) {
  const apiKey = localStorage.getItem(CONFIG.STORAGE_KEYS.GOOGLE_MAPS_KEY);
  if (!apiKey || !dropEl) return;

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${encodeURIComponent(apiKey)}`
    );
    const data = await res.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      dropEl.innerHTML = '';
      dropEl.style.display = 'none';
      return;
    }

    const results = data.results.slice(0, 5);
    dropEl.innerHTML = results.map(r => {
      const addr = r.formatted_address.replace(/'/g, '&#39;');
      return `<div class="loc-suggestion"
                   onmousedown="event.preventDefault()"
                   onclick="selectLocationSuggestion(event,'${entityType}',${entityIdx},'${addr}')">
                ${r.formatted_address}
              </div>`;
    }).join('');
    dropEl.style.display = 'block';
  } catch (e) {
    if (dropEl) { dropEl.innerHTML = ''; dropEl.style.display = 'none'; }
  }
}

function selectLocationSuggestion(event, entityType, entityIdx, address) {
  event.preventDefault();
  const inputEl = document.getElementById(`loc-input-${entityType}-${entityIdx}`);
  if (inputEl) inputEl.value = address;
  const dropEl = document.getElementById(`loc-drop-${entityType}-${entityIdx}`);
  if (dropEl) { dropEl.innerHTML = ''; dropEl.style.display = 'none'; }

  if (entityType === 'activity') {
    updateActivity(entityIdx, 'location', address);
  } else if (entityType === 'accommodation') {
    updateAccommodation(entityIdx, 'location', address);
  }
}

function closeLocationDropdown(dropId) {
  // Small delay so a click on a suggestion registers before we close
  setTimeout(() => {
    const el = document.getElementById(dropId);
    if (el) { el.innerHTML = ''; el.style.display = 'none'; }
  }, 150);
}

// ── Settings test helper ─────────────────────────────────────────────────────

/**
 * Test the stored Google Maps key by attempting to geocode via REST.
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
