// MAPS.JS — Google Maps integration for the section Map tab

// ── API loader (singleton, promise-based) ────────────────────────────────────

let _mapsApiState = 'idle'; // 'idle' | 'loading' | 'ready' | 'error'
let _mapsApiCallbacks = [];
let _currentMapInstance = null;
let _currentMarkers     = [];   // all point markers (for bulk clearMarkers)
let _transportPolylines = [];   // polyline objects for transport routes
let _activityMarkers    = {};   // { activityIdx:      marker }
let _accomMarkers       = {};   // { accomIdx:         marker }
let _transportMarkers   = {};   // { transportIdx:     start marker }
let _pendingFocusType   = null; // set before map load to auto-focus after
let _pendingFocusIdx    = null;

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
  _transportPolylines.forEach(p => p.setMap(null));
  _currentMarkers     = [];
  _transportPolylines = [];
  _activityMarkers    = {};
  _accomMarkers       = {};
  _transportMarkers   = {};
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
    _pendingFocusType = type;
    _pendingFocusIdx  = idx;
    return;
  }
  const marker = type === 'activity'      ? _activityMarkers[idx]
               : type === 'accommodation' ? _accomMarkers[idx]
               :                            _transportMarkers[idx];
  if (!marker) return;

  _currentMapInstance.panTo(marker.getPosition());
  _currentMapInstance.setZoom(15);
  google.maps.event.trigger(marker, 'click');

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

  /** Build a hotel SVG pin icon for Google Maps */
  function hotelIcon() {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">',
      // teardrop pin body
      '<path d="M16 1C7.7 1 1 7.7 1 16c0 11.5 15 23 15 23S31 27.5 31 16C31 7.7 24.3 1 16 1z"',
      ' fill="#764ba2" stroke="white" stroke-width="1.5"/>',
      // building rectangle
      '<rect x="7" y="8" width="18" height="14" rx="1.5" fill="white"/>',
      // three windows top row
      '<rect x="9"  y="11" width="4" height="3" rx="0.5" fill="#764ba2"/>',
      '<rect x="14" y="11" width="4" height="3" rx="0.5" fill="#764ba2"/>',
      '<rect x="19" y="11" width="4" height="3" rx="0.5" fill="#764ba2"/>',
      // door centred
      '<rect x="13" y="17" width="6" height="5" rx="0.5" fill="#764ba2"/>',
      '</svg>',
    ].join('');
    return {
      url:        'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(32, 40),
      anchor:     new google.maps.Point(16, 40),
    };
  }

  /**
   * Geocode searchText, drop a marker and extend bounds.
   * iconType: 'activity' (numbered circle) | 'accommodation' (hotel SVG pin)
   */
  function placeMarker(searchText, label, pinColor, infoTitle, markerStore, storeKey, iconType) {
    return new Promise(resolve => {
      const query = searchText +
        (city && !searchText.toLowerCase().includes(city.toLowerCase())
          ? `, ${city}` : '');

      geocoder.geocode({ address: query }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const pos = results[0].geometry.location;

          const isHotel = iconType === 'accommodation';

          const marker = new google.maps.Marker({
            position: pos,
            map,
            title: infoTitle,
            ...(isHotel
              ? { icon: hotelIcon() }
              : {
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
                }
            ),
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

  // Activity markers — blue (#1976D2), numbered circles
  const activityPromises = segment.activities.map((a, idx) => {
    const searchText = (a.location && a.location.trim()) ? a.location.trim() : a.title;
    return placeMarker(searchText, String(idx + 1), '#1976D2', a.title, _activityMarkers, idx, 'activity');
  });

  // Accommodation markers — purple hotel SVG pin
  const accomPromises = segment.accommodations.map((acc, idx) =>
    placeMarker(acc.location || acc.name, '', '#764ba2', acc.name, _accomMarkers, idx, 'accommodation')
  );

  // Transport routes — orange start/end markers + dashed polyline
  const transportPromises = (segment.transports || []).map((t, idx) => {
    if (!t.from && !t.to) return Promise.resolve();
    return new Promise(resolve => {
      const queries = [];
      if (t.from) queries.push({ key: 'from', addr: t.from });
      if (t.to)   queries.push({ key: 'to',   addr: t.to   });
      const pos = {};
      let done = 0;
      queries.forEach(q => {
        geocoder.geocode({ address: q.addr }, (results, status) => {
          if (status === 'OK' && results[0]) pos[q.key] = results[0].geometry.location;
          if (++done === queries.length) {
            // Start marker — numbered orange circle
            if (pos.from) {
              const startMarker = new google.maps.Marker({
                position: pos.from, map,
                title: `${t.title || 'Transport'} — start`,
                icon:  { path: google.maps.SymbolPath.CIRCLE, scale: 11, fillColor: '#f57c00', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
                label: { text: String(idx + 1), color: '#fff', fontSize: '10px', fontWeight: 'bold' },
              });
              const iw = new google.maps.InfoWindow({
                content: `<div style="font-size:13px;font-weight:500;padding:4px 6px;">
                  ${getTransportModeIcon(t.mode)} ${t.title || getTransportModeName(t.mode)}<br>
                  <span style="font-size:11px;color:#666;">${t.from || '?'} → ${t.to || '?'}</span><br>
                  ${(t.from && t.to) ? `<a href="${buildDirectionsUrl(t)}" target="_blank" style="font-size:11px;color:#1976D2;margin-top:4px;display:inline-block;">🗺️ Get Directions</a>` : ''}
                </div>`,
              });
              startMarker.addListener('click', () => iw.open(map, startMarker));
              _currentMarkers.push(startMarker);
              _transportMarkers[idx] = startMarker;
              bounds.extend(pos.from);
              placed++;
            }
            // End marker — smaller orange dot
            if (pos.to) {
              const endMarker = new google.maps.Marker({
                position: pos.to, map,
                title: `${t.title || 'Transport'} — end`,
                icon: { path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#e65100', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 1.5 },
              });
              _currentMarkers.push(endMarker);
              bounds.extend(pos.to);
              placed++;
            }
            // Dashed arrow polyline from start to end
            if (pos.from && pos.to) {
              const line = new google.maps.Polyline({
                path: [pos.from, pos.to],
                strokeColor:   '#f57c00',
                strokeOpacity: 0,
                strokeWeight:  3,
                icons: [
                  { icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.8, strokeColor: '#f57c00', scale: 4 }, offset: '0', repeat: '18px' },
                  { icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, fillColor: '#f57c00', fillOpacity: 1, strokeWeight: 0, strokeColor: '#f57c00' }, offset: '55%' },
                ],
                map,
              });
              _transportPolylines.push(line);
            }
            resolve();
          }
        });
      });
    });
  });

  await Promise.all([...activityPromises, ...accomPromises, ...transportPromises]);

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

// ── Transport helpers (also used by main.js) ─────────────────────────────────

const TRANSPORT_MODES = [
  { value: 'rental_car', label: '🚗 Rental Car',       gMaps: 'driving'  },
  { value: 'uber',       label: '🚕 Uber / Rideshare', gMaps: 'driving'  },
  { value: 'taxi',       label: '🚖 Taxi',             gMaps: 'driving'  },
  { value: 'bus',        label: '🚌 Bus',              gMaps: 'transit'  },
  { value: 'train',      label: '🚂 Train',            gMaps: 'transit'  },
  { value: 'flight',     label: '✈️ Flight',           gMaps: 'driving'  },
  { value: 'metro',      label: '🚇 Metro / Subway',   gMaps: 'transit'  },
  { value: 'ferry',      label: '⛴️ Ferry',            gMaps: 'transit'  },
  { value: 'walk',       label: '🚶 Walk',             gMaps: 'walking'  },
  { value: 'bicycle',    label: '🚲 Bicycle',          gMaps: 'bicycling'},
  { value: 'scooter',    label: '🛵 Scooter',          gMaps: 'driving'  },
  { value: 'shuttle',    label: '🚌 Shuttle / Coach',  gMaps: 'driving'  },
  { value: 'cruise',     label: '🛳️ Cruise',           gMaps: 'driving'  },
  { value: 'other',      label: '🚀 Other',            gMaps: 'driving'  },
];

function getTransportModeIcon(mode) {
  const m = TRANSPORT_MODES.find(x => x.value === mode);
  return m ? m.label.split(' ')[0] : '🚗';
}

function getTransportModeName(mode) {
  const m = TRANSPORT_MODES.find(x => x.value === mode);
  return m ? m.label.replace(/^\S+\s*/, '') : 'Transport';
}

function buildDirectionsUrl(transport) {
  const m = TRANSPORT_MODES.find(x => x.value === transport.mode);
  const travelMode = m ? m.gMaps : 'driving';
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(transport.from || '')}&destination=${encodeURIComponent(transport.to || '')}&travelmode=${travelMode}`;
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
  } else if (entityType === 'transport-from') {
    updateTransport(entityIdx, 'from', address);
  } else if (entityType === 'transport-to') {
    updateTransport(entityIdx, 'to', address);
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
