// MAIN.JS - App initialization and main logic

let currentSegmentId = 1;
let currentSectionNumber = 1;

/**
 * Initialize app
 */
function initApp() {
  const app = document.getElementById('app');
  
  // Create main structure
  app.innerHTML = UIComponents.createHeader() + `
    <div class="tab-panel active" id="panel-0">
      <div class="trip-summary-section">
        <div class="summary-title">Trip overview - Click to select</div>
        <div class="summary-grid" id="summaryGrid"></div>
      </div>
      <div id="segmentInfo" class="segment-info" style="display: none;"></div>
      <div id="segmentTabsContainer" style="display: none;">
        <div class="segment-tabs">
          <button class="segment-tab-btn active" onclick="switchSegmentTab(0)">Itinerary</button>
          <button class="segment-tab-btn" onclick="switchSegmentTab(1)">Accommodation</button>
          <button class="segment-tab-btn" onclick="switchSegmentTab(2)">Transport</button>
          <button class="segment-tab-btn" onclick="switchSegmentTab(3)">Map</button>
        </div>
        <div class="segment-content active" id="segTab-0">
          <div class="section-title">Daily schedule</div>
          <div id="itineraryContent"></div>
          <button class="btn-add" style="margin-top: 1rem;" onclick="addActivity()">+ Add activity</button>
        </div>
        <div class="segment-content" id="segTab-1">
          <div class="section-title">Lodging</div>
          <div id="accommodationContent"></div>
          <button class="btn-add" style="margin-top: 1rem;" onclick="addAccommodation()">+ Add accommodation</button>
        </div>
        <div class="segment-content" id="segTab-2">
          <div class="section-title">Getting around</div>
          <div id="transportContent"></div>
          <button class="btn-add" style="margin-top: 1rem;" onclick="addTransport()">+ Add transport</button>
        </div>
        <div class="segment-content" id="segTab-3">
          <div class="map-container">
            <div class="map-area">
              <div class="map-title" id="mapTabTitle">📍 Section 1 - Rome - Map</div>
              <div class="map-placeholder">
                Google Maps embed<br/>
                <span style="font-size: 12px; margin-top: 8px; display: block;">Map showing all activity & accommodation pins for this section</span>
              </div>
            </div>
            <div class="map-sidebar">
              <div class="sidebar-section">
                <div class="sidebar-title">📍 Activities</div>
                <div id="mapActivitiesContent"></div>
              </div>
              <div class="sidebar-section">
                <div class="sidebar-title">🏨 Accommodation</div>
                <div id="mapAccommodationContent"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="tab-panel" id="panel-1">
      <div id="botContainer"></div>
    </div>
    <div class="tab-panel" id="panel-2">
      <div id="settingsContainer"></div>
    </div>
  `;

  // Render initial content
  renderSummary();
  selectSegment(1, 1);
  initTravelAgentBot();
  initSettings();
}

/**
 * Switch header tab
 */
function switchHeaderTab(tabIndex) {
  document.querySelectorAll('.tab-panel').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.header-tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(`panel-${tabIndex}`).classList.add('active');
  document.querySelectorAll('.header-tab-btn')[tabIndex].classList.add('active');
}

/**
 * Render summary cards
 */
function renderSummary() {
  const html = TRIP_DATA.sections.map((s, idx) => UIComponents.createSummaryCard(s, idx)).join('');
  document.getElementById('summaryGrid').innerHTML = html;
}

/**
 * Select segment
 */
function selectSegment(segmentId, sectionNumber) {
  currentSegmentId = segmentId;
  currentSectionNumber = sectionNumber;
  const segment = TRIP_DATA.sections.find(s => s.id === currentSegmentId);
  
  if (!segment) return;

  document.querySelectorAll('.summary-card').forEach(el => el.classList.remove('active'));
  document.getElementById(`card-${segmentId}`).classList.add('active');
  
  document.getElementById('segmentTabsContainer').style.display = 'block';
  document.getElementById('segmentInfo').style.display = 'grid';
  document.getElementById('segmentInfo').innerHTML = `
    ${UIComponents.createInfoStat('Nights', segment.nights)}
    ${UIComponents.createInfoStat('Check-in', segment.startDate)}
    ${UIComponents.createInfoStat('Cost estimate', segment.cost)}
    ${UIComponents.createInfoStat('Status', 'Not booked')}
  `;
  
  document.getElementById('mapTabTitle').textContent = `📍 Section ${sectionNumber} - ${segment.name} - Map`;
  
  renderSegmentContent();
}

/**
 * Render segment content
 */
function renderSegmentContent() {
  const segment = TRIP_DATA.sections.find(s => s.id === currentSegmentId);
  if (!segment) return;

  // Itinerary
  document.getElementById('itineraryContent').innerHTML = segment.activities
    .map((a, i) => UIComponents.createActivityCard(a, i))
    .join('');

  // Accommodation
  document.getElementById('accommodationContent').innerHTML = segment.accommodations
    .map(a => `
      <div style="background: var(--color-background-secondary); padding: 1rem; border-radius: 4px; margin-bottom: 0.75rem; border: 0.5px solid var(--color-border-tertiary);">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
          <div>
            <div style="font-weight: 500; font-size: 13px; color: var(--color-text-primary);">${a.name}</div>
            <div style="font-size: 12px; color: var(--color-text-secondary);">${a.checkIn} to ${a.checkOut}</div>
          </div>
          <div style="font-size: 12px; color: var(--color-text-info); font-weight: 500;">${a.cost}</div>
        </div>
      </div>
    `)
    .join('');

  // Map Sidebar
  document.getElementById('mapActivitiesContent').innerHTML = segment.activities
    .map((a, idx) => `
      <div class="map-item">
        <div class="map-item-time">${a.time}</div>
        <div class="map-item-title">${a.title}</div>
        <div class="map-item-badge">📌 Pin ${idx + 1}</div>
      </div>
    `)
    .join('');

  document.getElementById('mapAccommodationContent').innerHTML = segment.accommodations
    .map((acc, idx) => `
      <div class="map-item">
        <div class="map-item-title">${acc.name}</div>
        <div class="map-item-subtitle">${acc.checkIn} to ${acc.checkOut}</div>
        <div class="map-item-badge">🏨 Hotel ${idx + 1}</div>
      </div>
    `)
    .join('');
}

/**
 * Switch segment tab
 */
function switchSegmentTab(tabIndex) {
  document.querySelectorAll('.segment-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.segment-tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(`segTab-${tabIndex}`).classList.add('active');
  document.querySelectorAll('.segment-tab-btn')[tabIndex].classList.add('active');
}

/**
 * Add activity
 */
function addActivity() {
  const segment = TRIP_DATA.sections.find(s => s.id === currentSegmentId);
  if (!segment) return;
  
  const newId = Math.max(...segment.activities.map(a => a.id), 0) + 1;
  segment.activities.push({
    id: newId,
    time: '10:00',
    title: 'New activity',
    notes: '',
    location: ''
  });
  
  renderSegmentContent();
  Storage.saveTripData(TRIP_DATA);
}

/**
 * Remove activity
 */
function removeActivity(idx) {
  const segment = TRIP_DATA.sections.find(s => s.id === currentSegmentId);
  if (segment) {
    segment.activities.splice(idx, 1);
    renderSegmentContent();
    Storage.saveTripData(TRIP_DATA);
  }
}

/**
 * Update activity
 */
function updateActivity(idx, field, value) {
  const segment = TRIP_DATA.sections.find(s => s.id === currentSegmentId);
  if (segment && segment.activities[idx]) {
    segment.activities[idx][field] = value;
    Storage.saveTripData(TRIP_DATA);
  }
}

/**
 * Add accommodation (placeholder)
 */
function addAccommodation() {
  alert('Add accommodation feature coming soon');
}

/**
 * Add transport (placeholder)
 */
function addTransport() {
  alert('Add transport feature coming soon');
}

/**
 * Go to map
 */
function goToMap(idx) {
  switchSegmentTab(3);
}

// Initialize app on load
document.addEventListener('DOMContentLoaded', initApp);
