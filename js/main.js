// MAIN.JS - App initialization and main logic

let currentSegmentId = 1;
let currentSectionNumber = 1;
let currentTripId = null;
let lastDeletedActivity = null;
let currentSelectedDay = 1;
let currentPlannerView = 'planner';

// ─── App Init ────────────────────────────────────────────────────────────────

function initApp() {
  const app = document.getElementById('app');

  app.innerHTML = UIComponents.createHeader() + `
    <div class="tab-panel active" id="panel-0">

      <div class="trip-selector-bar">
        <div class="trip-selector-left">
          <label class="trip-selector-label">Current Trip</label>
          <div class="trip-select-group">
            <select id="tripSelect" class="trip-select" onchange="switchTrip(this.value)"></select>
            <button class="btn-trip-edit" onclick="showRenameTripModal()" title="Rename trip">✏️</button>
          </div>
          <button class="btn-trip-view" id="btnViewHome" onclick="switchPlannerView('planner')" title="Overview">🏠</button>
          <button class="btn-trip-view" id="btnViewBudget" onclick="switchPlannerView('budget')" title="Budget">💰</button>
          <button class="btn-trip-view" id="btnViewFlights" onclick="switchPlannerView('flights')" title="Flights">🛫</button>
          <button class="btn-trip-action btn-trip-export" onclick="exportTripToExcel()" title="Export to Excel">📤</button>
          <button class="btn-trip-action btn-trip-delete" onclick="deleteCurrentTrip()" title="Delete trip">🗑️</button>
        </div>
        <div class="trip-selector-right">
          <div class="import-tooltip-wrap">
            <button class="btn-import-trip" onclick="document.getElementById('importTripFile').click()">📥 Import</button>
            <div class="import-tooltip">
              <strong>How to use AI to plan your trip:</strong><br>
              1. Export this sample trip as a spreadsheet<br>
              2. Share the file with Claude or ChatGPT<br>
              3. Ask the AI to fill in your trip details and return the same sheet format<br>
              4. Import the completed sheet here
            </div>
          </div>
          <input type="file" id="importTripFile" accept=".xlsx,.xls" style="display:none"
                 onchange="handleImportFile(this)">
          <button class="btn-new-trip" onclick="showNewTripModal()">+ New Trip</button>
        </div>
      </div>

      <div class="trip-info-tile" id="tripSummaryBar"></div>

      <div id="plannerMainView">
        <div class="trip-summary-section">
          <div class="summary-grid" id="summaryGrid"></div>
          <button class="btn-add-section" onclick="addSection()">+ Add Section</button>
        </div>

        <div id="segmentTabsContainer" style="display:none;">
          <div class="section-detail-header">
            <span class="section-detail-number" id="sectionDetailNumber">1</span>
            <div class="detail-field-group">
              <label class="detail-date-label">Section Name</label>
              <input type="text" class="section-detail-title" id="sectionDetailTitle"
                     onchange="updateSectionTitle(this.value)" placeholder="Section name">
            </div>
            <div class="detail-date-group">
              <label class="detail-date-label">Arrival</label>
              <input type="date" class="detail-date-input" id="sectionArrivalDate"
                     onchange="updateSectionDate(currentSegmentId, 'startDate', this.value)">
            </div>
            <div class="detail-date-group">
              <label class="detail-date-label">Departure</label>
              <input type="date" class="detail-date-input" id="sectionDepartureDate"
                     onchange="updateSectionDate(currentSegmentId, 'endDate', this.value)">
            </div>
            <button class="btn-delete-section" onclick="deleteSection()" title="Delete this section">🗑️</button>
          </div>
          <div class="segment-tabs">
            <button class="segment-tab-btn active" onclick="switchSegmentTab(0)">Itinerary</button>
            <button class="segment-tab-btn" onclick="switchSegmentTab(1)">Accommodation</button>
            <button class="segment-tab-btn" onclick="switchSegmentTab(2)">Transport</button>
            <button class="segment-tab-btn" onclick="switchSegmentTab(3)">Map</button>
          </div>
          <div class="segment-content active" id="segTab-0">
            <div class="itinerary-day-bar">
              <label class="day-bar-label">Day</label>
              <select id="itineraryDaySelect" class="day-select" onchange="switchItineraryDay(parseInt(this.value))"></select>
            </div>
            <div id="itineraryContent"></div>
            <button class="btn-add" style="margin-top:1rem;" onclick="addActivity()">+ Add activity</button>
          </div>
          <div class="segment-content" id="segTab-1">
            <div class="section-title">Lodging</div>
            <div id="accommodationContent"></div>
            <button class="btn-add" style="margin-top:1rem;" onclick="addAccommodation()">+ Add accommodation</button>
          </div>
          <div class="segment-content" id="segTab-2">
            <div class="section-title">Getting around</div>
            <div id="transportContent"></div>
            <button class="btn-add" style="margin-top:1rem;" onclick="addTransport()">+ Add transport</button>
          </div>
          <div class="segment-content" id="segTab-3">
            <div class="map-container">
              <div class="map-area">
                <div class="map-title" id="mapTabTitle">📍 Section 1 - Rome - Map</div>
                <div id="googleMap" class="google-map-embed"></div>
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
                <div class="sidebar-section">
                  <div class="sidebar-title">🚌 Transport</div>
                  <div id="mapTransportContent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="budgetSubView" style="display:none;">
        <div class="budget-page">
          <div class="budget-page-header">
            <div>
              <div class="budget-page-title">Trip Budget</div>
              <div class="budget-page-subtitle">Track all booking commitments and deposits</div>
            </div>
            <button class="btn-add" onclick="addBudgetItem()">+ Add Item</button>
          </div>
          <div class="budget-page-body">
            <div class="budget-top-row">
              <div class="budget-field">
                <label class="budget-label">Local Currency</label>
                <select id="budgetLocalCurrency" class="budget-currency-select" onchange="saveBudget(); syncFxPanel()">
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="THB">THB</option>
                  <option value="SGD">SGD</option>
                  <option value="CHF">CHF</option>
                  <option value="AUD">AUD</option>
                  <option value="NZD">NZD</option>
                  <option value="CAD">CAD</option>
                  <option value="HKD">HKD</option>
                  <option value="MXN">MXN</option>
                  <option value="INR">INR</option>
                </select>
              </div>
              <div class="budget-field">
                <label class="budget-label">Home Currency</label>
                <select id="budgetCurrency" class="budget-currency-select" onchange="saveBudget(); syncFxPanel()">
                  <option value="AUD">AUD</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="NZD">NZD</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>
              <div class="budget-field budget-field-total">
                <label class="budget-label">Total Budget</label>
                <input type="number" id="budgetTotal" class="budget-total-input" placeholder="0" min="0" oninput="saveBudget()">
              </div>
              <div class="budget-stat-block">
                <div class="budget-stat-label">Allocated</div>
                <div class="budget-stat-value" id="budgetAllocated">0</div>
              </div>
              <div class="budget-stat-block">
                <div class="budget-stat-label">Actual Paid</div>
                <div class="budget-stat-value" id="budgetActualPaid">0</div>
              </div>
              <div class="budget-stat-block">
                <div class="budget-stat-label">Outstanding</div>
                <div class="budget-stat-value" id="budgetRemaining">0</div>
              </div>
            </div>
            <div class="budget-progress-bar-wrap" style="margin:0 1.5rem 1rem;">
              <div class="budget-progress-bar" id="budgetProgressBar" style="width:0%"></div>
            </div>
            <!-- ── Currency Converter ── -->
            <div class="fx-panel">
              <div class="fx-panel-title">💱 Currency Converter</div>
              <div class="fx-row">
                <input type="number" id="fxAmount" class="fx-amount" value="100" min="0" oninput="runFxConvert()">
                <select id="fxFrom" class="fx-select" onchange="runFxConvert()">
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="AUD">AUD</option>
                  <option value="NZD">NZD</option>
                  <option value="CAD">CAD</option>
                  <option value="CHF">CHF</option>
                  <option value="SGD">SGD</option>
                  <option value="THB">THB</option>
                </select>
                <span class="fx-arrow">→</span>
                <select id="fxTo" class="fx-select" onchange="runFxConvert()">
                  <option value="AUD" selected>AUD</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="NZD">NZD</option>
                  <option value="CAD">CAD</option>
                  <option value="CHF">CHF</option>
                  <option value="SGD">SGD</option>
                  <option value="THB">THB</option>
                </select>
                <div id="fxResult" class="fx-result">—</div>
              </div>
              <div id="fxRates" class="fx-rates"></div>
            </div>

            <div class="budget-cats-manage">
              <div id="budgetCustomCats" class="budget-custom-cats-list"></div>
              <button class="btn-add-cat" onclick="addBudgetCategory()">＋ Category</button>
            </div>
            <div id="budgetItemsContent" class="budget-items-content"></div>
          </div>
        </div>
      </div>

      <div id="flightsSubView" style="display:none;">
        <div class="flights-page">

          <!-- ── Google Flights Search Panel ── -->
          <div class="gf-panel">
            <div class="gf-panel-title">🔍 Search Google Flights</div>
            <div class="gf-fields-row">
              <div class="gf-field gf-field-airport">
                <label class="gf-label">From</label>
                <input type="text" id="gfFrom" class="gf-input" placeholder="SYD or Sydney">
              </div>
              <button class="gf-swap-btn" onclick="swapFlightEndpoints()" title="Swap">⇌</button>
              <div class="gf-field gf-field-airport">
                <label class="gf-label">To</label>
                <input type="text" id="gfTo" class="gf-input" placeholder="FCO or Rome">
              </div>
              <div class="gf-field gf-field-date">
                <label class="gf-label">Depart</label>
                <input type="date" id="gfDepart" class="gf-input">
              </div>
              <div class="gf-field gf-field-date">
                <label class="gf-label">Return <span class="gf-optional">(optional)</span></label>
                <input type="date" id="gfReturn" class="gf-input">
              </div>
              <div class="gf-field gf-field-sm">
                <label class="gf-label">Pax</label>
                <input type="number" id="gfPax" class="gf-input" value="1" min="1" max="9">
              </div>
              <div class="gf-field gf-field-class">
                <label class="gf-label">Class</label>
                <select id="gfClass" class="gf-input gf-select">
                  <option value="f">Economy</option>
                  <option value="w">Premium Economy</option>
                  <option value="j">Business</option>
                  <option value="c">First</option>
                </select>
              </div>
              <button class="gf-search-btn" onclick="openGoogleFlights()">Search Google Flights ✈️</button>
            </div>
          </div>

          <div class="flights-page-header">
            <div>
              <div class="flights-page-title">Flight Tracker</div>
              <div class="flights-page-subtitle">Track all your flights, booking refs, and costs</div>
            </div>
            <button class="btn-add" onclick="addFlight()">+ Add Flight</button>
          </div>
          <div id="flightsContent"></div>
        </div>
      </div>
    </div>

    <div class="tab-panel" id="panel-1">
      <div id="botContainer"></div>
    </div>
    <div class="tab-panel" id="panel-2">
      <div id="settingsContainer"></div>
    </div>
    <div class="tab-panel" id="panel-3">
      <div id="faqContainer"></div>
    </div>
  `;

  initTrips();
  initTravelAgentBot();
  initSettings();
  renderFlights();
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

function calcNights(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const s = new Date(startDate + 'T00:00:00');
  const e = new Date(endDate + 'T00:00:00');
  return Math.max(0, Math.round((e - s) / 86400000));
}

function updateSectionDate(sectionId, field, value) {
  const section = TRIP_DATA.sections.find(s => s.id === sectionId);
  if (!section) return;
  section[field] = value;
  section.nights = calcNights(section.startDate, section.endDate);
  Storage.saveTripData(TRIP_DATA);
  renderSummary();
  renderTripSummaryBar();
  if (currentSegmentId === sectionId) {
    populateItineraryDaySelect(section);
  }
  showSavedIndicator('Dates updated');
}

// ─── Header ───────────────────────────────────────────────────────────────────

function updateHeader() {
  const titleEl = document.getElementById('headerTripTitle');
  if (titleEl) titleEl.textContent = ((TRIP_DATA.title || 'Travel Portal') + ' OVERVIEW').toUpperCase();
}

function renderTripSummaryBar() {
  const bar = document.getElementById('tripSummaryBar');
  if (!bar) return;

  const sections = TRIP_DATA.sections || [];

  if (sections.length === 0) {
    bar.innerHTML = '';
    bar.style.display = 'none';
    return;
  }

  bar.style.display = 'flex';

  const totalNights = sections.reduce((sum, s) => sum + calcNights(s.startDate, s.endDate), 0);
  const starts  = sections.map(s => s.startDate).filter(Boolean).sort();
  const ends    = sections.map(s => s.endDate).filter(Boolean).sort();
  const startDate = starts[0] || '';
  const endDate   = ends[ends.length - 1] || '';

  // Budget allocated total from line items
  const items = (TRIP_DATA.budget && TRIP_DATA.budget.items) || [];
  const budgetTotal = items.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0);
  const currency = (TRIP_DATA.budget && TRIP_DATA.budget.currency) || 'AUD';
  const budgetStr = budgetTotal > 0
    ? `${currency} ${budgetTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : '—';

  const dateRange = (startDate && endDate)
    ? `${UIComponents.formatDate(startDate)} → ${UIComponents.formatDate(endDate)}`
    : '—';

  bar.innerHTML = `
    <div class="trip-info-stat">
      <span class="trip-info-label">Dates</span>
      <span class="trip-info-value">${dateRange}</span>
    </div>
    <div class="trip-info-stat">
      <span class="trip-info-label">Nights</span>
      <span class="trip-info-value">${totalNights}</span>
    </div>
    <div class="trip-info-stat">
      <span class="trip-info-label">Destinations</span>
      <span class="trip-info-value">${sections.length}</span>
    </div>
    <div class="trip-info-stat">
      <span class="trip-info-label">Budget</span>
      <span class="trip-info-value">${budgetStr}</span>
    </div>
  `;
}

// ─── Multi-Trip ───────────────────────────────────────────────────────────────

function initTrips() {
  Storage.migrateLegacyData();

  let trips = Storage.getTripsList();

  if (trips.length === 0) {
    const defaultTrip = Object.assign({}, TRIP_DATA, { id: Date.now() });
    if (!defaultTrip.budget) {
      defaultTrip.budget = { total: 0, currency: 'AUD', categories: { accommodation: 0, flights: 0, food: 0, activities: 0, transport: 0, other: 0 } };
    }
    Storage.saveTrip(defaultTrip);
    trips = [{ id: defaultTrip.id, title: defaultTrip.title, destination: defaultTrip.destination }];
    Storage.saveTripsList(trips);
    Storage.setActiveTripId(defaultTrip.id);
  }

  let activeId = Storage.getActiveTripId();
  if (!activeId || !trips.find(t => String(t.id) === String(activeId))) {
    activeId = trips[0].id;
    Storage.setActiveTripId(activeId);
  }

  currentTripId = activeId;

  const tripData = Storage.loadTrip(activeId);
  if (tripData) {
    Object.assign(TRIP_DATA, tripData);
    if (!TRIP_DATA.budget) {
      TRIP_DATA.budget = { total: 0, currency: 'AUD', customCategories: [], items: [] };
    }
    if (!TRIP_DATA.budget.items) TRIP_DATA.budget.items = [];
    if (!TRIP_DATA.budget.customCategories) TRIP_DATA.budget.customCategories = [];
    if (!TRIP_DATA.flights) TRIP_DATA.flights = [];
    tripManager.data = TRIP_DATA;
  }

  renderTripSelector();
  updateHeader();
  renderSummary();
  renderTripSummaryBar();
  renderBudget();

  if (TRIP_DATA.sections && TRIP_DATA.sections.length > 0) {
    selectSegment(TRIP_DATA.sections[0].id, 1);
  }
}

function renderTripSelector() {
  const trips = Storage.getTripsList();
  const select = document.getElementById('tripSelect');
  if (!select) return;
  select.innerHTML = trips.map(t =>
    `<option value="${t.id}" ${String(t.id) === String(currentTripId) ? 'selected' : ''}>${t.title}</option>`
  ).join('');
}

function switchTrip(id) {
  Storage.saveTripData(TRIP_DATA);
  currentTripId = id;
  Storage.setActiveTripId(id);

  const tripData = Storage.loadTrip(id);
  if (tripData) {
    Object.assign(TRIP_DATA, tripData);
    if (!TRIP_DATA.budget) {
      TRIP_DATA.budget = { total: 0, currency: 'AUD', customCategories: [], items: [] };
    }
    if (!TRIP_DATA.budget.items) TRIP_DATA.budget.items = [];
    if (!TRIP_DATA.budget.customCategories) TRIP_DATA.budget.customCategories = [];
    if (!TRIP_DATA.flights) TRIP_DATA.flights = [];
    tripManager.data = TRIP_DATA;
  }

  updateHeader();
  renderSummary();
  renderTripSummaryBar();
  renderBudget();

  if (TRIP_DATA.sections && TRIP_DATA.sections.length > 0) {
    selectSegment(TRIP_DATA.sections[0].id, 1);
  } else {
    document.getElementById('segmentTabsContainer').style.display = 'none';
  }
}

// ─── Trip Modals ──────────────────────────────────────────────────────────────

function showNewTripModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'newTripModal';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <div class="modal-title">New Trip</div>
        <button class="modal-close" onclick="closeNewTripModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="modal-field">
          <label class="field-label">Trip Name *</label>
          <input type="text" id="newTripName" class="activity-title-input" placeholder="e.g. Japan 2028">
          <div class="modal-field-error" id="newTripNameError" style="display:none;">Please enter a trip name.</div>
        </div>
        <div class="modal-field">
          <label class="field-label">Destination</label>
          <input type="text" id="newTripDest" class="activity-title-input" placeholder="e.g. Sydney → Tokyo">
        </div>
        <div class="modal-field-row">
          <div class="modal-field">
            <label class="field-label">Start Date</label>
            <input type="date" id="newTripStart" class="activity-title-input">
          </div>
          <div class="modal-field">
            <label class="field-label">End Date</label>
            <input type="date" id="newTripEnd" class="activity-title-input">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-small" onclick="closeNewTripModal()">Cancel</button>
        <button class="btn-new-trip" onclick="createNewTrip()">Create Trip</button>
      </div>
    </div>
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeNewTripModal(); });
  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('newTripName').focus(), 50);
}

function closeNewTripModal() {
  const modal = document.getElementById('newTripModal');
  if (modal) modal.remove();
}

function createNewTrip() {
  const nameInput = document.getElementById('newTripName');
  const name = (nameInput.value || '').trim();
  const errorEl = document.getElementById('newTripNameError');

  if (!name) {
    nameInput.style.borderColor = '#d32f2f';
    errorEl.style.display = 'block';
    nameInput.focus();
    return;
  }

  const dest = (document.getElementById('newTripDest').value || '').trim() || 'TBD';
  const start = document.getElementById('newTripStart').value;
  const end = document.getElementById('newTripEnd').value;
  const trip = createEmptyTrip(name, dest, start, end);

  const trips = Storage.getTripsList();
  trips.push({ id: trip.id, title: trip.title, destination: trip.destination });
  Storage.saveTripsList(trips);
  Storage.saveTrip(trip);

  closeNewTripModal();

  Object.assign(TRIP_DATA, trip);
  tripManager.data = TRIP_DATA;
  currentTripId = trip.id;
  Storage.setActiveTripId(trip.id);

  renderTripSelector();
  updateHeader();
  renderSummary();
  renderTripSummaryBar();
  renderBudget();

  document.getElementById('segmentTabsContainer').style.display = 'none';
  showSavedIndicator('Trip created');
}

function showRenameTripModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'renameTripModal';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <div class="modal-title">Rename Trip</div>
        <button class="modal-close" onclick="closeRenameTripModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="modal-field">
          <label class="field-label">Trip Name *</label>
          <input type="text" id="renameTripInput" class="activity-title-input" value="${TRIP_DATA.title || ''}">
          <div class="modal-field-error" id="renameTripError" style="display:none;">Please enter a trip name.</div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-small" onclick="closeRenameTripModal()">Cancel</button>
        <button class="btn-new-trip" onclick="confirmRenameTrip()">Save</button>
      </div>
    </div>
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeRenameTripModal(); });
  document.body.appendChild(overlay);
  const input = document.getElementById('renameTripInput');
  setTimeout(() => { input.focus(); input.select(); }, 50);
}

function closeRenameTripModal() {
  const modal = document.getElementById('renameTripModal');
  if (modal) modal.remove();
}

function confirmRenameTrip() {
  const input = document.getElementById('renameTripInput');
  const newName = (input.value || '').trim();
  if (!newName) {
    input.style.borderColor = '#d32f2f';
    document.getElementById('renameTripError').style.display = 'block';
    input.focus();
    return;
  }
  TRIP_DATA.title = newName;
  const trips = Storage.getTripsList();
  const tripMeta = trips.find(t => String(t.id) === String(currentTripId));
  if (tripMeta) tripMeta.title = newName;
  Storage.saveTripsList(trips);
  Storage.saveTripData(TRIP_DATA);
  renderTripSelector();
  updateHeader();
  closeRenameTripModal();
  showSavedIndicator('Renamed');
}

function deleteCurrentTrip() {
  const trips = Storage.getTripsList();
  if (trips.length <= 1) {
    showToast('Cannot delete the only trip. Create another trip first.');
    return;
  }
  if (!confirm(`Delete "${TRIP_DATA.title}"? This cannot be undone.`)) return;

  localStorage.removeItem(CONFIG.STORAGE_KEYS.TRIP_PREFIX + currentTripId);
  const newList = trips.filter(t => String(t.id) !== String(currentTripId));
  Storage.saveTripsList(newList);

  const next = newList[0];
  currentTripId = next.id;
  Storage.setActiveTripId(next.id);

  const tripData = Storage.loadTrip(next.id);
  if (tripData) {
    Object.assign(TRIP_DATA, tripData);
    if (!TRIP_DATA.budget) {
      TRIP_DATA.budget = { total: 0, currency: 'AUD', customCategories: [], items: [] };
    }
    if (!TRIP_DATA.budget.items) TRIP_DATA.budget.items = [];
    if (!TRIP_DATA.budget.customCategories) TRIP_DATA.budget.customCategories = [];
    if (!TRIP_DATA.flights) TRIP_DATA.flights = [];
    tripManager.data = TRIP_DATA;
  }

  renderTripSelector();
  updateHeader();
  renderSummary();
  renderTripSummaryBar();
  renderBudget();

  if (TRIP_DATA.sections && TRIP_DATA.sections.length > 0) {
    selectSegment(TRIP_DATA.sections[0].id, 1);
  } else {
    document.getElementById('segmentTabsContainer').style.display = 'none';
  }
}

// ─── Budget Accordion ─────────────────────────────────────────────────────────

function toggleBudgetAccordion() {
  const body = document.getElementById('budgetBody');
  const chevron = document.getElementById('budgetChevron');
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  if (chevron) chevron.textContent = isOpen ? '▾' : '▴';
}

const BUDGET_STANDARD_CATEGORIES = [
  { key: 'flights',       label: 'Flights' },
  { key: 'accommodation', label: 'Accommodation' },
  { key: 'transport',     label: 'Transport' },
  { key: 'food',          label: 'Food &amp; Dining' },
  { key: 'activities',    label: 'Activities &amp; Tours' },
  { key: 'shopping',      label: 'Shopping' },
  { key: 'insurance',     label: 'Travel Insurance' },
  { key: 'visas',         label: 'Visas &amp; Entry Fees' },
  { key: 'health',        label: 'Health &amp; Medical' },
  { key: 'comms',         label: 'Communications' },
  { key: 'misc',          label: 'Misc / Other' },
];

function getBudgetCategories() {
  const custom = (TRIP_DATA.budget?.customCategories || []).map(c => ({
    key: 'custom-' + c.toLowerCase().replace(/\s+/g, '-'),
    label: c
  }));
  return [...BUDGET_STANDARD_CATEGORIES, ...custom];
}

function renderBudget() {
  const b = TRIP_DATA.budget;
  if (!b) return;
  const homeCurrEl  = document.getElementById('budgetCurrency');
  if (homeCurrEl)  homeCurrEl.value  = b.currency      || 'AUD';
  const localCurrEl = document.getElementById('budgetLocalCurrency');
  if (localCurrEl) localCurrEl.value = b.localCurrency || 'EUR';
  const totalEl = document.getElementById('budgetTotal');
  if (totalEl) totalEl.value = b.total || '';
  syncFxPanel();
  renderBudgetCategories();
  renderBudgetItems();
  updateBudgetSummary();
  syncTransportsToBudget(); // pull in any transport costs not yet reflected
}

function saveBudget() {
  if (!TRIP_DATA.budget) {
    TRIP_DATA.budget = { total: 0, currency: 'AUD', localCurrency: 'EUR', customCategories: [], items: [] };
  }
  TRIP_DATA.budget.currency      = document.getElementById('budgetCurrency').value;
  TRIP_DATA.budget.localCurrency = document.getElementById('budgetLocalCurrency')?.value || 'EUR';
  TRIP_DATA.budget.total         = parseFloat(document.getElementById('budgetTotal').value) || 0;
  Storage.saveTripData(TRIP_DATA);
  updateBudgetSummary();
  showSavedIndicator();
}

function getLocalCurrency()  { return TRIP_DATA.budget?.localCurrency || 'EUR'; }
function getHomeCurrency()   { return TRIP_DATA.budget?.currency       || 'AUD'; }

function syncFxPanel() {
  const localEl = document.getElementById('fxFrom');
  const homeEl  = document.getElementById('fxTo');
  if (localEl) localEl.value = getLocalCurrency();
  if (homeEl)  homeEl.value  = getHomeCurrency();
  runFxConvert();
}

function updateBudgetSummary() {
  const b = TRIP_DATA.budget;
  if (!b) return;
  renderTripSummaryBar(); // keep tile in sync when budget changes
  const total    = b.total || 0;
  const currency = b.currency || 'AUD';
  const items    = b.items || [];
  const allocated   = items.reduce((s, i) => s + (i.totalAmount  || 0), 0);
  const actualPaid  = items.reduce((s, i) => s + (i.depositPaid  || 0), 0);
  const outstanding = items.reduce((s, i) => s + Math.max(0, (i.totalAmount || 0) - (i.depositPaid || 0)), 0);
  const pct = total > 0 ? Math.min((allocated / total) * 100, 100) : 0;
  const fmt = n => Math.round(n).toLocaleString();

  const allocEl = document.getElementById('budgetAllocated');
  const paidEl  = document.getElementById('budgetActualPaid');
  const remEl   = document.getElementById('budgetRemaining');
  const barEl   = document.getElementById('budgetProgressBar');

  if (allocEl) allocEl.textContent = `${currency} ${fmt(allocated)}`;
  if (paidEl)  paidEl.textContent  = `${currency} ${fmt(actualPaid)}`;
  if (remEl) {
    remEl.textContent  = `${currency} ${fmt(outstanding)}`;
    remEl.style.color  = outstanding > 0 ? '#f57c00' : 'var(--color-text-primary)';
  }
  if (barEl) {
    barEl.style.width      = pct + '%';
    barEl.style.background = pct >= 100 ? '#d32f2f' : pct >= 80 ? '#f57c00' : '#1976D2';
  }
}

// ─── Budget Items ─────────────────────────────────────────────────────────────

function renderBudgetCategories() {
  const container = document.getElementById('budgetCustomCats');
  if (!container) return;
  const custom = TRIP_DATA.budget?.customCategories || [];
  container.innerHTML = custom.map((c, i) =>
    `<span class="budget-cat-chip">${UIComponents.escapeHtml(c)}<button onclick="removeBudgetCategory(${i})">×</button></span>`
  ).join('');
}

function addBudgetCategory() {
  const name = prompt('New category name:');
  if (!name || !name.trim()) return;
  if (!TRIP_DATA.budget.customCategories) TRIP_DATA.budget.customCategories = [];
  TRIP_DATA.budget.customCategories.push(name.trim());
  Storage.saveTripData(TRIP_DATA);
  renderBudgetCategories();
  renderBudgetItems();
}

function removeBudgetCategory(index) {
  if (!TRIP_DATA.budget?.customCategories) return;
  TRIP_DATA.budget.customCategories.splice(index, 1);
  Storage.saveTripData(TRIP_DATA);
  renderBudgetCategories();
  renderBudgetItems();
}

function renderBudgetItems() {
  const container = document.getElementById('budgetItemsContent');
  if (!container) return;
  const items = TRIP_DATA.budget?.items || [];
  if (items.length === 0) {
    container.innerHTML = `
      <div class="budget-items-empty">
        <div class="budget-empty-icon">💰</div>
        <div class="budget-empty-text">No budget items yet</div>
        <div class="budget-empty-desc">Add items to track your bookings, deposits and outstanding payments.</div>
      </div>`;
    return;
  }
  try {
    const cur = TRIP_DATA.budget?.currency || 'AUD';
    const header = `
      <div class="budget-list-header">
        <span class="bli-num"></span>
        <span class="bli-desc">Description</span>
        <span class="bli-cat">Category</span>
        <span class="bli-date-input">Start</span>
        <span class="bli-date-input">End</span>
        <span class="bli-ref">Ref #</span>
        <span class="bli-amount">Total (${cur})</span>
        <span class="bli-amount">Deposit</span>
        <span class="bli-amount">Outstanding</span>
        <span class="bli-actions"></span>
      </div>`;
    container.innerHTML = header + items.map((item, i) => buildBudgetItemCard(item, i)).join('');
  } catch (e) {
    console.error('renderBudgetItems error:', e);
    container.innerHTML = `<div class="budget-items-empty"><div class="budget-empty-text">Error rendering items — check console.</div></div>`;
  }
}

function buildBudgetItemCard(item, index) {
  const cats = getBudgetCategories();
  const catOptions = cats.map(c =>
    `<option value="${c.key}" ${item.category === c.key ? 'selected' : ''}>${c.label}</option>`
  ).join('');
  const outstanding = Math.max(0, (item.totalAmount || 0) - (item.depositPaid || 0));
  const currency = TRIP_DATA.budget?.currency || 'AUD';
  const fmt = n => Math.round(n).toLocaleString();
  const synced = item._transportSync;
  const ro = synced ? 'readonly disabled' : '';
  const esc = s => UIComponents.escapeHtml(s || '');

  return `
    <div class="budget-item-row${synced ? ' budget-item-synced' : ''}" id="bli-${index}">

      <!-- ── Single compact line ── -->
      <div class="bli-main">
        <span class="bli-num">${index + 1}${synced ? '<span class="bli-sync-dot" title="Synced from Transport">🚌</span>' : ''}</span>
        <input type="text" class="bli-desc" value="${esc(item.description)}"
               placeholder="Description" ${ro}
               onchange="updateBudgetItem(${index},'description',this.value)">
        <select class="bli-cat" ${ro}
                onchange="updateBudgetItem(${index},'category',this.value)">
          ${catOptions}
        </select>
        <input type="date" class="bli-date-input${synced ? ' bli-date-synced' : ''}" value="${item.startDate || ''}"
               ${synced ? 'readonly' : ''}
               onchange="updateBudgetItem(${index},'startDate',this.value)">
        <input type="date" class="bli-date-input${synced ? ' bli-date-synced' : ''}" value="${item.endDate || ''}"
               ${synced ? 'readonly' : ''}
               onchange="updateBudgetItem(${index},'endDate',this.value)">
        <input type="text" class="bli-ref" value="${esc(item.refNum)}"
               placeholder="Ref #" ${ro}
               onchange="updateBudgetItem(${index},'refNum',this.value)">
        <input type="number" class="bli-amount-input" value="${item.totalAmount || ''}"
               placeholder="0" min="0" ${ro}
               oninput="updateBudgetItem(${index},'totalAmount',parseFloat(this.value)||0)">
        <input type="number" class="bli-amount-input deposit-input" value="${item.depositPaid || ''}"
               placeholder="0" min="0" ${ro}
               oninput="updateBudgetItem(${index},'depositPaid',parseFloat(this.value)||0)">
        <span class="bli-outstanding" id="budget-outstanding-${index}">${fmt(outstanding)}</span>
        <div class="bli-actions">
          <button class="bli-expand-btn" onclick="toggleBudgetDetails(${index})" title="Notes &amp; location">▾</button>
          ${synced
            ? `<span class="bli-sync-note" title="Edit cost in Transport tab">🔒</span>`
            : `<button class="btn-remove-budget-item" onclick="removeBudgetItem(${index})">×</button>`}
        </div>
      </div>

      <!-- ── Expandable details (notes + location) ── -->
      <div class="bli-details" id="bli-details-${index}" style="display:none;">
        <div class="bli-details-grid">
          <div class="bli-detail-group">
            <label class="bli-detail-label">Booking Date</label>
            <input type="date" class="bli-detail-input" value="${item.bookingDate || ''}"
                   onchange="updateBudgetItem(${index},'bookingDate',this.value)">
          </div>
          <div class="bli-detail-group bli-detail-group--wide">
            <label class="bli-detail-label">Location</label>
            <input type="text" class="bli-detail-input" value="${esc(item.location)}"
                   placeholder="e.g. Rome, Italy"
                   onchange="updateBudgetItem(${index},'location',this.value)">
          </div>
        </div>
        <div class="bli-detail-group bli-notes-group">
          <label class="bli-detail-label">Notes</label>
          <textarea class="bli-notes-input" placeholder="Any booking notes, confirmation details…"
                    onchange="updateBudgetItem(${index},'notes',this.value)">${esc(item.notes)}</textarea>
        </div>
      </div>
    </div>`;
}

function toggleBudgetDetails(index) {
  const el = document.getElementById(`bli-details-${index}`);
  const btn = document.querySelector(`#bli-${index} .bli-expand-btn`);
  if (!el) return;
  const open = el.style.display === 'none' || el.style.display === '';
  el.style.display = open ? 'block' : 'none';
  if (btn) btn.textContent = open ? '▴' : '▾';
}

function addBudgetItem() {
  if (!TRIP_DATA.budget) TRIP_DATA.budget = { total: 0, currency: 'AUD', localCurrency: 'EUR', customCategories: [], items: [] };
  if (!TRIP_DATA.budget.items) TRIP_DATA.budget.items = [];
  TRIP_DATA.budget.items.push({
    id: Date.now(),
    bookingDate: '',
    description: '',
    category: 'flights',
    refNum: '',
    startDate: '',
    endDate: '',
    totalAmount: 0,
    depositPaid: 0
  });
  Storage.saveTripData(TRIP_DATA);
  renderBudgetItems();
  updateBudgetSummary();
}

function removeBudgetItem(index) {
  if (!TRIP_DATA.budget?.items) return;
  TRIP_DATA.budget.items.splice(index, 1);
  Storage.saveTripData(TRIP_DATA);
  renderBudgetItems();
  updateBudgetSummary();
}

function updateBudgetItem(index, field, value) {
  if (!TRIP_DATA.budget?.items?.[index]) return;
  TRIP_DATA.budget.items[index][field] = value;
  Storage.saveTripData(TRIP_DATA);
  if (field === 'totalAmount' || field === 'depositPaid') {
    const item = TRIP_DATA.budget.items[index];
    const outstanding = Math.max(0, (item.totalAmount || 0) - (item.depositPaid || 0));
    const currency = TRIP_DATA.budget?.currency || 'AUD';
    const outEl = document.getElementById(`budget-outstanding-${index}`);
    if (outEl) outEl.textContent = `${currency} ${Math.round(outstanding).toLocaleString()}`;
    updateBudgetSummary();
  }
  showSavedIndicator();
}

// ─── Feedback: Toast + Saved Indicator ───────────────────────────────────────

function showSavedIndicator(label) {
  let el = document.getElementById('savedIndicator');
  if (!el) {
    el = document.createElement('div');
    el.id = 'savedIndicator';
    el.className = 'saved-indicator';
    document.body.appendChild(el);
  }
  el.textContent = '✓ ' + (label || 'Saved');
  el.classList.add('visible');
  clearTimeout(window._savedTimer);
  window._savedTimer = setTimeout(() => el.classList.remove('visible'), 2000);
}

function showToast(message) {
  const existing = document.getElementById('infoToast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'infoToast';
  toast.className = 'undo-toast visible';
  toast.style.cssText = 'background:#323232;';
  toast.innerHTML = `<span>${message}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function showUndoToast(message, undoFn) {
  const existing = document.getElementById('undoToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'undoToast';
  toast.className = 'undo-toast';
  toast.innerHTML = `<span>${message}</span><button class="undo-toast-btn" onclick="undoAction()">Undo</button>`;
  document.body.appendChild(toast);

  window._undoFn = undoFn;
  clearTimeout(window._undoTimer);
  window._undoTimer = setTimeout(() => {
    toast.remove();
    window._undoFn = null;
    lastDeletedActivity = null;
  }, 5000);

  requestAnimationFrame(() => toast.classList.add('visible'));
}

function undoAction() {
  if (window._undoFn) {
    window._undoFn();
    window._undoFn = null;
  }
  clearTimeout(window._undoTimer);
  const toast = document.getElementById('undoToast');
  if (toast) toast.remove();
}

// ─── Trip Planner ─────────────────────────────────────────────────────────────

function switchHeaderTab(tabIndex) {
  document.querySelectorAll('.tab-panel').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.header-tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(`panel-${tabIndex}`).classList.add('active');
  document.querySelectorAll('.header-tab-btn')[tabIndex].classList.add('active');
  if (tabIndex === 0) switchPlannerView(currentPlannerView);
  if (tabIndex === 3) initFaq();
}

function openFaq(sectionId) {
  switchHeaderTab(3);
  if (sectionId) {
    // Give the FAQ a tick to render before scrolling
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }
}

function switchPlannerView(view) {
  currentPlannerView = view;
  document.getElementById('plannerMainView').style.display = view === 'planner' ? '' : 'none';
  document.getElementById('budgetSubView').style.display   = view === 'budget'  ? '' : 'none';
  document.getElementById('flightsSubView').style.display  = view === 'flights' ? '' : 'none';

  document.getElementById('btnViewHome').classList.toggle('active',    view === 'planner');
  document.getElementById('btnViewBudget').classList.toggle('active',  view === 'budget');
  document.getElementById('btnViewFlights').classList.toggle('active', view === 'flights');

  if (view === 'budget')  renderBudget();
  if (view === 'flights') renderFlights();
}

function renderSummary() {
  if (!TRIP_DATA.sections || TRIP_DATA.sections.length === 0) {
    document.getElementById('summaryGrid').innerHTML = `
      <div class="empty-trip-state">
        <div class="empty-trip-icon">✈️</div>
        <div class="empty-trip-text">No destinations yet</div>
        <div class="empty-trip-desc">Use the Travel Agent to start planning, or add destinations to get started.</div>
      </div>
    `;
    renderTripSummaryBar();
    return;
  }
  const html = TRIP_DATA.sections.map((s, idx) => UIComponents.createSummaryCard(s, idx)).join('');
  document.getElementById('summaryGrid').innerHTML = html;
  if (currentSegmentId) {
    const card = document.getElementById(`card-${currentSegmentId}`);
    if (card) card.classList.add('active');
  }
  renderTripSummaryBar();
}

function selectSegment(segmentId, sectionNumber) {
  currentSegmentId = segmentId;
  currentSectionNumber = sectionNumber;
  const segment = TRIP_DATA.sections.find(s => s.id === currentSegmentId);
  if (!segment) return;

  document.querySelectorAll('.summary-card').forEach(el => el.classList.remove('active'));
  const card = document.getElementById(`card-${segmentId}`);
  if (card) card.classList.add('active');

  document.getElementById('segmentTabsContainer').style.display = 'block';
  document.getElementById('sectionDetailNumber').textContent = sectionNumber;
  document.getElementById('sectionDetailTitle').value = segment.name;
  document.getElementById('mapTabTitle').textContent = `📍 Section ${sectionNumber} - ${segment.name} - Map`;

  currentSelectedDay = 1;
  populateItineraryDaySelect(segment);

  const arrivalEl = document.getElementById('sectionArrivalDate');
  const departureEl = document.getElementById('sectionDepartureDate');
  if (arrivalEl) arrivalEl.value = segment.startDate || '';
  if (departureEl) departureEl.value = segment.endDate || '';

  renderSegmentContent();
}

function updateSectionTitle(value) {
  const segment = TRIP_DATA.sections.find(s => s.id === currentSegmentId);
  if (!segment) return;
  segment.name = value;
  Storage.saveTripData(TRIP_DATA);
  renderSummary();
  const card = document.getElementById(`card-${currentSegmentId}`);
  if (card) card.classList.add('active');
  document.getElementById('mapTabTitle').textContent = `📍 Section ${currentSectionNumber} - ${value} - Map`;
  showSavedIndicator('Section renamed');
}

function getDaysForSection(segment) {
  const count = Math.max(segment.nights || 1, 1);
  const days = [];
  for (let i = 0; i < count; i++) {
    let label;
    if (segment.startDate) {
      const d = new Date(segment.startDate + 'T00:00:00');
      d.setDate(d.getDate() + i);
      const dayLabel = d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
      label = `Day ${i + 1} — ${dayLabel}`;
    } else {
      label = `Day ${i + 1}`;
    }
    days.push({ day: i + 1, label });
  }
  return days;
}

function populateItineraryDaySelect(segment) {
  const select = document.getElementById('itineraryDaySelect');
  if (!select) return;
  const days = getDaysForSection(segment);
  select.innerHTML = days.map(d => `<option value="${d.day}">${d.label}</option>`).join('');
  select.value = currentSelectedDay;
}

function switchItineraryDay(dayNum) {
  currentSelectedDay = dayNum;
  renderSegmentContent();
}

function deleteSection() {
  const section = TRIP_DATA.sections.find(s => s.id === currentSegmentId);
  if (!section) return;
  if (TRIP_DATA.sections.length <= 1) {
    alert('A trip must have at least one section.');
    return;
  }
  if (!confirm(`Delete "${section.name}"? This will remove all its activities and accommodation.`)) return;

  const idx = TRIP_DATA.sections.findIndex(s => s.id === currentSegmentId);
  TRIP_DATA.sections.splice(idx, 1);
  Storage.saveTripData(TRIP_DATA);

  document.getElementById('segmentTabsContainer').style.display = 'none';
  currentSegmentId = null;
  currentSectionNumber = null;

  renderSummary();
  renderTripSummaryBar();

  // Auto-select the section that now occupies the same position, or the last one
  if (TRIP_DATA.sections.length > 0) {
    const next = TRIP_DATA.sections[Math.min(idx, TRIP_DATA.sections.length - 1)];
    selectSegment(next.id, TRIP_DATA.sections.indexOf(next) + 1);
  }
  showSavedIndicator('Section deleted');
}

function addSection() {
  const num = TRIP_DATA.sections.length + 1;
  const newSection = {
    id: Date.now(),
    number: num,
    name: `Section ${num}`,
    nights: 1,
    startDate: '',
    endDate: '',
    cost: '',
    highlights: '',
    location: '',
    activities: [],
    accommodations: [],
    transports: []
  };
  TRIP_DATA.sections.push(newSection);
  Storage.saveTripData(TRIP_DATA);
  renderSummary();
  renderTripSummaryBar();
  selectSegment(newSection.id, num);
  showSavedIndicator('Section added');
}

function renderSegmentContent() {
  const segment = TRIP_DATA.sections.find(s => s.id === currentSegmentId);
  if (!segment) return;

  const dayActivities = segment.activities
    .map((a, i) => ({ activity: a, originalIndex: i }))
    .filter(({ activity }) => (activity.day || 1) === currentSelectedDay)
    .sort((a, b) => (a.activity.priority || 1) - (b.activity.priority || 1));

  document.getElementById('itineraryContent').innerHTML = dayActivities.length
    ? dayActivities.map(({ activity, originalIndex }, i) => UIComponents.createActivityCard(activity, originalIndex, i + 1)).join('')
    : '<div class="itinerary-empty">No activities for this day yet. Click + Add activity to get started.</div>';

  renderAccommodationContent(segment);
  renderTransportContent(segment);

  document.getElementById('mapActivitiesContent').innerHTML = segment.activities
    .map((a, idx) => `
      <div class="map-item" id="map-item-activity-${idx}"
           onclick="focusMapMarker('activity',${idx})" style="cursor:pointer;">
        <div class="map-item-time">${a.time || ''}</div>
        <div class="map-item-title">${a.title}</div>
        <div class="map-item-badge">📌 Pin ${idx + 1}</div>
      </div>
    `)
    .join('') || '<div style="color:#aaa;font-size:12px;padding:0.5rem;">No activities yet.</div>';

  document.getElementById('mapAccommodationContent').innerHTML = segment.accommodations
    .map((acc, idx) => `
      <div class="map-item" id="map-item-accommodation-${idx}"
           onclick="focusMapMarker('accommodation',${idx})" style="cursor:pointer;">
        <div class="map-item-title">${acc.name}</div>
        <div class="map-item-subtitle">${acc.checkIn || ''} ${acc.checkOut ? '→ ' + acc.checkOut : ''}</div>
        <div class="map-item-badge">🏨 Hotel ${idx + 1}</div>
      </div>
    `)
    .join('') || '<div style="color:#aaa;font-size:12px;padding:0.5rem;">No accommodation yet.</div>';

  document.getElementById('mapTransportContent').innerHTML = (segment.transports || [])
    .map((t, idx) => {
      const icon = typeof getTransportModeIcon === 'function' ? getTransportModeIcon(t.mode) : '🚗';
      const name = typeof getTransportModeName === 'function' ? getTransportModeName(t.mode) : '';
      const directionsUrl = (t.from && t.to && typeof buildDirectionsUrl === 'function')
        ? buildDirectionsUrl(t) : '';
      return `
        <div class="map-item map-transport-item" id="map-item-transport-${idx}"
             onclick="focusMapMarker('transport',${idx})" style="cursor:pointer;">
          <div class="map-item-time">${icon} ${name}</div>
          <div class="map-item-title">${t.title || (t.from && t.to ? t.from + ' → ' + t.to : 'Unnamed route')}</div>
          ${t.from || t.to ? `<div class="map-item-subtitle">${t.from || '?'} → ${t.to || '?'}</div>` : ''}
          <div style="margin-top:4px;">
            <span class="map-item-badge" style="background:#fff3e0;color:#e65100;">🚌 Route ${idx + 1}</span>
            ${directionsUrl ? `<a href="${directionsUrl}" target="_blank" onclick="event.stopPropagation()" class="map-directions-link">🗺️ Directions</a>` : ''}
          </div>
        </div>`;
    })
    .join('') || '<div style="color:#aaa;font-size:12px;padding:0.5rem;">No transport yet.</div>';
}

function switchSegmentTab(tabIndex) {
  document.querySelectorAll('.segment-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.segment-tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(`segTab-${tabIndex}`).classList.add('active');
  document.querySelectorAll('.segment-tab-btn')[tabIndex].classList.add('active');

  // Tab 3 = Map — initialise the live Google Map whenever it's shown
  if (tabIndex === 3 && typeof initSectionMap === 'function') {
    const segment = TRIP_DATA.sections.find(s => s.id === currentSegmentId);
    if (segment) initSectionMap(segment);
  }
}

// ─── Activities ───────────────────────────────────────────────────────────────

function addActivity() {
  const segment = TRIP_DATA.sections.find(s => s.id === currentSegmentId);
  if (!segment) return;
  const newId = Math.max(...segment.activities.map(a => a.id), 0) + 1;
  segment.activities.push({ id: newId, day: currentSelectedDay, priority: 3, durationHrs: 1, durationMins: 0, time: '10:00', title: 'New activity', notes: '', location: '' });
  renderSegmentContent();
  Storage.saveTripData(TRIP_DATA);
  showSavedIndicator('Activity added');
}

function removeActivity(idx) {
  const segment = TRIP_DATA.sections.find(s => s.id === currentSegmentId);
  if (!segment) return;

  lastDeletedActivity = { segmentId: currentSegmentId, idx, activity: Object.assign({}, segment.activities[idx]) };
  segment.activities.splice(idx, 1);
  renderSegmentContent();
  Storage.saveTripData(TRIP_DATA);

  showUndoToast('Activity removed', () => {
    const seg = TRIP_DATA.sections.find(s => s.id === lastDeletedActivity.segmentId);
    if (seg) {
      seg.activities.splice(lastDeletedActivity.idx, 0, lastDeletedActivity.activity);
      renderSegmentContent();
      Storage.saveTripData(TRIP_DATA);
      renderSummary();
    }
    lastDeletedActivity = null;
  });
}

function updateActivity(idx, field, value) {
  const segment = TRIP_DATA.sections.find(s => s.id === currentSegmentId);
  if (segment && segment.activities[idx]) {
    segment.activities[idx][field] = value;
    Storage.saveTripData(TRIP_DATA);
  }
}

function updatePriority(idx, value) {
  updateActivity(idx, 'priority', value);
  renderSegmentContent();
}

function searchMapLocation(index, value) {
  updateActivity(index, 'location', value);
}

// ─── Export ───────────────────────────────────────────────────────────────────

function exportTripToExcel() {
  if (typeof XLSX === 'undefined') {
    alert('Export library not loaded. Please check your internet connection and try again.');
    return;
  }

  const wb = XLSX.utils.book_new();
  const sections = TRIP_DATA.sections || [];
  const budget = TRIP_DATA.budget || {};
  const cats = budget.categories || {};

  // Derive trip-level dates from sections
  const starts = sections.map(s => s.startDate).filter(Boolean).sort();
  const ends   = sections.map(s => s.endDate).filter(Boolean).sort();
  const tripStart = starts[0] || '';
  const tripEnd   = ends[ends.length - 1] || '';
  const totalNights = sections.reduce((sum, s) => sum + calcNights(s.startDate, s.endDate), 0);

  // ── Sheet 1: Trip Summary ────────────────────────────────────────────────
  const wsSummary = XLSX.utils.aoa_to_sheet([
    ['TRIP SUMMARY'],
    [],
    ['Field', 'Value'],
    ['Trip Title',          TRIP_DATA.title || ''],
    ['Destination',         TRIP_DATA.destination || ''],
    ['Trip Start Date',     tripStart],
    ['Trip End Date',       tripEnd],
    ['Total Nights',        totalNights],
    ['Total Destinations',  sections.length],
    ['Total Activities',    sections.reduce((n, s) => n + (s.activities || []).length, 0)],
    ['Currency',            budget.currency || 'AUD'],
    ['Total Budget',        budget.total || 0],
    ['Exported At',         new Date().toLocaleString('en-AU')],
  ]);
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 36 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Trip Summary');

  // ── Sheet 2: Sections ────────────────────────────────────────────────────
  const sectionHeaders = ['#', 'Section Name', 'Arrival Date', 'Departure Date', 'Nights', 'Cost Estimate', 'Activities', 'Highlights', 'Location Coords'];
  const sectionRows = sections.map((s, i) => [
    i + 1,
    s.name || '',
    s.startDate || '',
    s.endDate || '',
    calcNights(s.startDate, s.endDate),
    s.cost || '',
    (s.activities || []).length,
    s.highlights || '',
    s.location || '',
  ]);
  const wsSections = XLSX.utils.aoa_to_sheet([sectionHeaders, ...sectionRows]);
  wsSections['!cols'] = [{ wch: 4 }, { wch: 24 }, { wch: 14 }, { wch: 14 }, { wch: 8 }, { wch: 16 }, { wch: 12 }, { wch: 36 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsSections, 'Sections');

  // ── Sheet 3: Itinerary ───────────────────────────────────────────────────
  const itinHeaders = ['Section', 'Day', 'Priority', 'Time', 'Duration', 'Activity Title', 'Notes', 'Location'];
  const itinRows = [];
  sections.forEach(s => {
    const sorted = [...(s.activities || [])].sort((a, b) => {
      if ((a.day || 1) !== (b.day || 1)) return (a.day || 1) - (b.day || 1);
      return (a.priority || 1) - (b.priority || 1);
    });
    sorted.forEach(a => {
      itinRows.push([
        s.name || '',
        a.day || 1,
        a.priority || '',
        a.time || '',
        (() => { const h = a.durationHrs||0, m = a.durationMins||0; return (h||m) ? `${h}h ${m}m` : (a.durationValue ? `${Math.floor(a.durationValue/60)}h ${a.durationValue%60}m` : ''); })(),
        a.title || '',
        a.notes || '',
        a.location || '',
      ]);
    });
  });
  const wsItin = XLSX.utils.aoa_to_sheet([itinHeaders, ...itinRows]);
  wsItin['!cols'] = [{ wch: 22 }, { wch: 6 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 30 }, { wch: 40 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsItin, 'Itinerary');

  // ── Sheet 4: Accommodation ───────────────────────────────────────────────
  const accomHeaders = ['Section', 'Property Name', 'Check-in', 'Check-out', 'Nights', 'Cost', 'Booking URL', 'Location'];
  const accomRows = [];
  sections.forEach(s => {
    (s.accommodations || []).forEach(a => {
      accomRows.push([
        s.name || '',
        a.name || '',
        a.checkIn || '',
        a.checkOut || '',
        calcNights(a.checkIn, a.checkOut),
        a.cost || '',
        a.url || '',
        a.location || '',
      ]);
    });
  });
  const wsAccom = XLSX.utils.aoa_to_sheet([accomHeaders, ...accomRows]);
  wsAccom['!cols'] = [{ wch: 22 }, { wch: 28 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 18 }, { wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsAccom, 'Accommodation');

  // ── Sheet 5: Budget ──────────────────────────────────────────────────────
  const wsBudget = XLSX.utils.aoa_to_sheet([
    ['BUDGET SUMMARY'],
    [],
    ['Category', `Amount (${budget.currency || 'AUD'})`],
    ['Accommodation',  cats.accommodation  || 0],
    ['Flights',        cats.flights        || 0],
    ['Food & Dining',  cats.food           || 0],
    ['Activities',     cats.activities     || 0],
    ['Transport',      cats.transport      || 0],
    ['Other',          cats.other          || 0],
    [],
    ['TOTAL BUDGET',   budget.total        || 0],
  ]);
  wsBudget['!cols'] = [{ wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsBudget, 'Budget');

  // ── Sheet 6: Flights ─────────────────────────────────────────────────────
  const flightHeaders = [
    '#', 'Type', 'From', 'To', 'Depart Date', 'Depart Time',
    'Arrive Date', 'Arrive Time', 'Airline', 'Flight #',
    'Booking Ref', `Cost (${budget.currency||'AUD'})`, 'Status', 'Notes',
  ];
  const flightRows = (TRIP_DATA.flights || []).map((f, i) => [
    i + 1, f.type||'', f.from||'', f.to||'',
    f.departDate||'', f.departTime||'', f.arriveDate||'', f.arriveTime||'',
    f.airline||'', f.flightNum||'', f.bookingRef||'', f.cost||0, f.status||'', f.notes||''
  ]);
  const wsFlights = XLSX.utils.aoa_to_sheet([flightHeaders, ...flightRows]);
  wsFlights['!cols'] = flightHeaders.map(() => ({ wch: 16 }));
  XLSX.utils.book_append_sheet(wb, wsFlights, 'Flights');

  // ── Sheet 7: Settings ────────────────────────────────────────────────────
  const wsSettings = XLSX.utils.aoa_to_sheet([
    ['BASE SETTINGS'],
    [],
    ['Setting', 'Value'],
    ['Trip Title',         TRIP_DATA.title || ''],
    ['Destination',        TRIP_DATA.destination || ''],
    ['Default Currency',   budget.currency || 'AUD'],
    ['Total Budget',       budget.total || 0],
    ['App Version',        CONFIG.VERSION || '1.0'],
    ['Data Exported',      new Date().toLocaleString('en-AU')],
  ]);
  wsSettings['!cols'] = [{ wch: 22 }, { wch: 36 }];
  XLSX.utils.book_append_sheet(wb, wsSettings, 'Settings');

  // ── Download ─────────────────────────────────────────────────────────────
  const safeName = (TRIP_DATA.title || 'trip').replace(/[^a-z0-9]/gi, '_');
  const dateStr  = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${safeName}_${dateStr}.xlsx`);
  showSavedIndicator('Exported to Excel');
}

// ─── Currency Converter ───────────────────────────────────────────────────────

const _fxCache = {};   // { 'EUR-AUD': { current: 1.62, avg90: 1.60, ts: Date.now() } }
const FX_TTL = 60 * 60 * 1000; // 1 hour cache

async function fetchFxRates(from, to) {
  const key = `${from}-${to}`;
  if (_fxCache[key] && Date.now() - _fxCache[key].ts < FX_TTL) return _fxCache[key];

  try {
    // Current rate
    const latestRes = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
    if (!latestRes.ok) throw new Error('rate fetch failed');
    const latestJson = await latestRes.json();
    const current = latestJson.rates[to];

    // 90-day average
    const end   = new Date();
    const start = new Date(); start.setDate(start.getDate() - 90);
    const fmt   = d => d.toISOString().slice(0, 10);
    const histRes = await fetch(
      `https://api.frankfurter.app/${fmt(start)}..${fmt(end)}?from=${from}&to=${to}`
    );
    let avg90 = current;
    if (histRes.ok) {
      const histJson = await histRes.json();
      const vals = Object.values(histJson.rates || {}).map(r => r[to]).filter(Boolean);
      if (vals.length > 0) avg90 = vals.reduce((a, b) => a + b, 0) / vals.length;
    }

    _fxCache[key] = { current, avg90, ts: Date.now() };
    return _fxCache[key];
  } catch (e) {
    return null;
  }
}

async function runFxConvert() {
  const amount  = parseFloat(document.getElementById('fxAmount')?.value) || 0;
  const from    = document.getElementById('fxFrom')?.value;
  const to      = document.getElementById('fxTo')?.value;
  const resEl   = document.getElementById('fxResult');
  const ratesEl = document.getElementById('fxRates');
  if (!resEl || !ratesEl || !from || !to) return;

  if (from === to) {
    resEl.textContent = `${amount.toFixed(2)} ${to}`;
    ratesEl.textContent = '';
    return;
  }

  resEl.textContent = '…';
  ratesEl.innerHTML = '<span class="fx-loading">Loading rates…</span>';

  const data = await fetchFxRates(from, to);
  if (!data) {
    resEl.textContent = '—';
    ratesEl.innerHTML = '<span class="fx-error">Could not load rates</span>';
    return;
  }

  const converted = amount * data.current;
  resEl.textContent = `${converted.toFixed(2)} ${to}`;
  ratesEl.innerHTML = `
    <span class="fx-rate-item">Current rate: <strong>1 ${from} = ${data.current.toFixed(4)} ${to}</strong></span>
    <span class="fx-rate-sep">·</span>
    <span class="fx-rate-item">90-day avg: <strong>1 ${from} = ${data.avg90.toFixed(4)} ${to}</strong></span>
    <span class="fx-rate-sep">·</span>
    <span class="fx-rate-item fx-rate-source">Source: ECB via frankfurter.app</span>
  `;
}

// ─── Flights ──────────────────────────────────────────────────────────────────

const FLIGHT_STATUSES = ['Not Booked', 'Searching', 'Booked', 'Confirmed', 'Checked In'];
const FLIGHT_TYPES    = ['Outbound', 'Return', 'Internal', 'Connection'];
const FLIGHT_STATUS_COLORS = {
  'Not Booked': '#9e9e9e', 'Searching': '#f57c00',
  'Booked': '#1976d2',     'Confirmed': '#2e7d32', 'Checked In': '#388e3c'
};

// ─── Google Flights Search ────────────────────────────────────────────────────

function populateFlightSearchDefaults() {
  const sections = (TRIP_DATA.sections || []).filter(s => s.startDate || s.endDate);
  if (sections.length > 0) {
    const first = sections[0];
    const last  = sections[sections.length - 1];
    const depart = document.getElementById('gfDepart');
    const ret    = document.getElementById('gfReturn');
    if (depart && first.startDate) depart.value = first.startDate;
    if (ret    && last.endDate)    ret.value    = last.endDate;
  }
}

function swapFlightEndpoints() {
  const fromEl = document.getElementById('gfFrom');
  const toEl   = document.getElementById('gfTo');
  if (!fromEl || !toEl) return;
  const tmp    = fromEl.value;
  fromEl.value = toEl.value;
  toEl.value   = tmp;
}

function openGoogleFlights() {
  const from   = (document.getElementById('gfFrom')?.value  || '').trim();
  const to     = (document.getElementById('gfTo')?.value    || '').trim();
  const depart = (document.getElementById('gfDepart')?.value || '').trim();
  const ret    = (document.getElementById('gfReturn')?.value || '').trim();
  const pax    = parseInt(document.getElementById('gfPax')?.value  || '1') || 1;
  const cls    = document.getElementById('gfClass')?.value  || 'f';
  const cur    = (TRIP_DATA.budget?.currency || 'AUD').toUpperCase();

  if (!from || !to) {
    alert('Please enter both a From and To airport or city.');
    return;
  }

  // Build segment strings: FROM.TO.DATE  (* = onward leg)
  let flt = `${encodeURIComponent(from)}.${encodeURIComponent(to)}`;
  if (depart) flt += `.${depart}`;
  if (ret) {
    flt += `*${encodeURIComponent(to)}.${encodeURIComponent(from)}.${ret}`;
  }

  const url = `https://www.google.com/flights#flt=${flt};c:${cur};e:${pax};sd:1;t:${cls}`;
  window.open(url, '_blank');
}

// ─── Flight Tracker ───────────────────────────────────────────────────────────

function renderFlights() {
  populateFlightSearchDefaults();
  const container = document.getElementById('flightsContent');
  if (!container) return;
  if (!TRIP_DATA.flights) TRIP_DATA.flights = [];
  const flights = TRIP_DATA.flights;
  if (flights.length === 0) {
    container.innerHTML = `
      <div class="flights-empty">
        <div class="flights-empty-icon">🛫</div>
        <div class="flights-empty-text">No flights added yet</div>
        <div class="flights-empty-desc">Add your outbound, return, and connecting flights to track bookings and costs.</div>
        <button class="btn-add" style="margin-top:1rem;" onclick="addFlight()">+ Add Flight</button>
      </div>`;
    return;
  }
  container.innerHTML = flights.map((f, i) => buildFlightCard(f, i)).join('');
}

function buildFlightCard(f, i) {
  const color  = FLIGHT_STATUS_COLORS[f.status] || '#9e9e9e';
  const typeOpts   = FLIGHT_TYPES.map(t =>
    `<option value="${t}" ${f.type === t ? 'selected' : ''}>${t}</option>`).join('');
  const statusOpts = FLIGHT_STATUSES.map(s =>
    `<option value="${s}" ${f.status === s ? 'selected' : ''}>${s}</option>`).join('');
  return `
    <div class="flight-card">
      <div class="flight-card-header">
        <select class="flight-type-select" onchange="updateFlight(${i},'type',this.value)">${typeOpts}</select>
        <div class="flight-route">
          <input type="text" class="flight-airport" value="${f.from||''}" placeholder="From (SYD)"
                 onchange="updateFlight(${i},'from',this.value)">
          <span class="flight-arrow">→</span>
          <input type="text" class="flight-airport" value="${f.to||''}" placeholder="To (FCO)"
                 onchange="updateFlight(${i},'to',this.value)">
        </div>
        <select class="flight-status-select" style="color:${color};border-color:${color}40;background:${color}12"
                onchange="updateFlightStatus(${i},this.value)">${statusOpts}</select>
        <button class="btn-remove-activity" onclick="removeFlight(${i})">×</button>
      </div>
      <div class="flight-times-row">
        <div class="flight-time-group">
          <span class="flight-time-label">Departure</span>
          <input type="date" class="flight-date-input" value="${f.departDate||''}"
                 onchange="updateFlight(${i},'departDate',this.value)">
          <input type="time" class="flight-time-input-sm" value="${f.departTime||''}"
                 onchange="updateFlight(${i},'departTime',this.value)">
        </div>
        <div class="flight-time-group">
          <span class="flight-time-label">Arrival</span>
          <input type="date" class="flight-date-input" value="${f.arriveDate||''}"
                 onchange="updateFlight(${i},'arriveDate',this.value)">
          <input type="time" class="flight-time-input-sm" value="${f.arriveTime||''}"
                 onchange="updateFlight(${i},'arriveTime',this.value)">
        </div>
      </div>
      <div class="flight-details-row">
        <div class="flight-detail-group">
          <label class="flight-detail-label">Airline</label>
          <input type="text" class="flight-detail-input" value="${f.airline||''}" placeholder="e.g. Qantas"
                 onchange="updateFlight(${i},'airline',this.value)">
        </div>
        <div class="flight-detail-group">
          <label class="flight-detail-label">Flight #</label>
          <input type="text" class="flight-detail-input" value="${f.flightNum||''}" placeholder="QF1"
                 onchange="updateFlight(${i},'flightNum',this.value)">
        </div>
        <div class="flight-detail-group">
          <label class="flight-detail-label">Booking Ref</label>
          <input type="text" class="flight-detail-input" value="${f.bookingRef||''}" placeholder="ABC123"
                 onchange="updateFlight(${i},'bookingRef',this.value)">
        </div>
        <div class="flight-detail-group">
          <label class="flight-detail-label">Cost (${TRIP_DATA.budget?.currency||'AUD'})</label>
          <input type="number" class="flight-detail-input" value="${f.cost||''}" placeholder="0"
                 onchange="updateFlight(${i},'cost',parseFloat(this.value)||0)">
        </div>
      </div>
      <div class="flight-notes-row">
        <label class="flight-detail-label">Notes</label>
        <input type="text" class="flight-notes-input" value="${f.notes||''}"
               placeholder="Meal preference, seat selection, baggage..."
               onchange="updateFlight(${i},'notes',this.value)">
      </div>
    </div>`;
}

function addFlight() {
  if (!TRIP_DATA.flights) TRIP_DATA.flights = [];
  TRIP_DATA.flights.push({
    id: Date.now(), type: 'Outbound', from: '', to: '',
    departDate: '', departTime: '', arriveDate: '', arriveTime: '',
    airline: '', flightNum: '', bookingRef: '', cost: 0,
    status: 'Not Booked', notes: ''
  });
  Storage.saveTripData(TRIP_DATA);
  renderFlights();
}

function removeFlight(idx) {
  if (!TRIP_DATA.flights) return;
  TRIP_DATA.flights.splice(idx, 1);
  Storage.saveTripData(TRIP_DATA);
  renderFlights();
  showSavedIndicator('Flight removed');
}

function updateFlight(idx, field, value) {
  if (!TRIP_DATA.flights || !TRIP_DATA.flights[idx]) return;
  TRIP_DATA.flights[idx][field] = value;
  Storage.saveTripData(TRIP_DATA);
}

function updateFlightStatus(idx, value) {
  updateFlight(idx, 'status', value);
  renderFlights();
}

// ─── Transport ───────────────────────────────────────────────────────────────

function renderTransportContent(segment) {
  const container = document.getElementById('transportContent');
  if (!container) return;
  if (!segment.transports || segment.transports.length === 0) {
    container.innerHTML = '<div class="itinerary-empty">No transport added yet. Click + Add transport to get started.</div>';
    return;
  }
  container.innerHTML = segment.transports.map((t, idx) => buildTransportCard(t, idx)).join('');
  // Populate FX conversion labels after DOM is ready
  segment.transports.forEach((_, idx) => refreshTransportCostFx(idx));
}

// Parse cost that may be stored as a legacy text string like "€150"
function parseTransportCost(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  return parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
}

async function refreshTransportCostFx(idx) {
  const el = document.getElementById(`transport-cost-fx-${idx}`);
  if (!el) return;
  const segment = TRIP_DATA.sections.find(s => s.id === currentSegmentId);
  const t = segment?.transports?.[idx];
  if (!t) return;
  const cost = parseTransportCost(t.cost);
  const localCur = getLocalCurrency();
  const homeCur  = getHomeCurrency();
  if (cost <= 0 || localCur === homeCur) { el.textContent = ''; return; }
  el.textContent = '…';
  const data = await fetchFxRates(localCur, homeCur);
  if (!data) { el.textContent = ''; return; }
  el.textContent = `≈ ${homeCur} ${(cost * data.current).toFixed(2)}`;
}

async function syncTransportsToBudget() {
  if (!TRIP_DATA.budget) return;
  if (!TRIP_DATA.budget.items) TRIP_DATA.budget.items = [];

  const localCur = getLocalCurrency();
  const homeCur  = getHomeCurrency();

  // Gather all transports with a cost across all sections
  const allTransports = [];
  for (const section of (TRIP_DATA.sections || [])) {
    for (const t of (section.transports || [])) {
      const cost = parseTransportCost(t.cost);
      if (cost > 0) allTransports.push({ ...t, cost, sectionName: section.name });
    }
  }

  // Remove previously auto-synced items, keep manual ones
  TRIP_DATA.budget.items = TRIP_DATA.budget.items.filter(item => !item._transportSync);

  if (allTransports.length > 0) {
    let rate = 1;
    if (localCur !== homeCur) {
      const fxData = await fetchFxRates(localCur, homeCur);
      if (fxData) rate = fxData.current;
    }
    for (const t of allTransports) {
      TRIP_DATA.budget.items.push({
        id:              t.id || Date.now() + Math.random(),
        _transportSync:  true,
        description:     t.title || `${t.from || '?'} → ${t.to || '?'}`,
        category:        'transport',
        refNum:          t.bookingRef || '',
        startDate:       t.startDate  || t.date || '',
        endDate:         t.endDate    || '',
        totalAmount:     Math.round(t.cost * rate * 100) / 100,
        depositPaid:     0,
        bookingDate:     '',
      });
    }
  }

  Storage.saveTripData(TRIP_DATA);
  if (currentPlannerView === 'budget') {
    renderBudgetItems();
    updateBudgetSummary();
  }
}

function calcTransportDuration(startDate, startTime, endDate, endTime) {
  if (!startDate || !startTime || !endDate || !endTime) return null;
  const start = new Date(`${startDate}T${startTime}`);
  const end   = new Date(`${endDate}T${endTime}`);
  const diffMs = end - start;
  if (diffMs <= 0) return null;
  const totalMins = Math.round(diffMs / 60000);
  const hrs  = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0)             return `${hrs}h`;
  return `${mins}m`;
}

function buildTransportCard(t, idx) {
  const esc = s => UIComponents.escapeHtml(s || '');
  const modes = typeof TRANSPORT_MODES !== 'undefined' ? TRANSPORT_MODES : [];
  const modeOptions = modes.map(m =>
    `<option value="${m.value}" ${t.mode === m.value ? 'selected' : ''}>${m.label}</option>`
  ).join('');
  const icon = typeof getTransportModeIcon === 'function' ? getTransportModeIcon(t.mode) : '🚗';

  // Backward-compat: old records stored date/time instead of startDate/startTime
  const startDate = t.startDate || t.date || '';
  const startTime = t.startTime || t.time || '';
  const endDate   = t.endDate   || '';
  const endTime   = t.endTime   || '';

  const duration = calcTransportDuration(startDate, startTime, endDate, endTime);
  const travelTimeHtml = duration
    ? `<div class="transport-travel-time">⏱ Travel time: <strong>${duration}</strong></div>`
    : `<div class="transport-travel-time transport-travel-time--empty">⏱ Travel time calculated from start &amp; finish</div>`;

  return `
    <div class="transport-card" id="transport-card-${idx}">
      <div class="transport-card-header">
        <span class="transport-mode-badge">${icon}</span>
        <input type="text" class="transport-title-input"
               value="${esc(t.title)}" placeholder="e.g. Drive to Florence"
               onchange="updateTransport(${idx},'title',this.value)">
        <select class="transport-mode-select"
                onchange="updateTransport(${idx},'mode',this.value); this.closest('.transport-card').querySelector('.transport-mode-badge').textContent = getTransportModeIcon(this.value)">
          ${modeOptions}
        </select>
        <button class="btn-remove-activity" onclick="removeTransport(${idx})">×</button>
      </div>

      <div class="transport-route-row">
        <div class="transport-point">
          <label class="field-label">FROM</label>
          <div class="location-search-wrap">
            <input type="text"
                   id="loc-input-transport-from-${idx}"
                   class="activity-search"
                   value="${esc(t.from)}"
                   placeholder="🔍 Start location"
                   oninput="locationSearchInput(this,'transport-from',${idx})"
                   onblur="closeLocationDropdown('loc-drop-transport-from-${idx}')">
            <div class="location-dropdown" id="loc-drop-transport-from-${idx}"></div>
          </div>
        </div>
        <div class="transport-route-arrow">→</div>
        <div class="transport-point">
          <label class="field-label">TO</label>
          <div class="location-search-wrap">
            <input type="text"
                   id="loc-input-transport-to-${idx}"
                   class="activity-search"
                   value="${esc(t.to)}"
                   placeholder="🔍 End location"
                   oninput="locationSearchInput(this,'transport-to',${idx})"
                   onblur="closeLocationDropdown('loc-drop-transport-to-${idx}')">
            <div class="location-dropdown" id="loc-drop-transport-to-${idx}"></div>
          </div>
        </div>
      </div>

      <div class="transport-datetime-row">
        <div class="transport-datetime-group">
          <label class="field-label">Start Date</label>
          <input type="date" class="transport-meta-input" value="${esc(startDate)}"
                 onchange="updateTransport(${idx},'startDate',this.value); refreshTransportTravelTime(${idx})">
        </div>
        <div class="transport-datetime-group">
          <label class="field-label">Start Time</label>
          <input type="time" class="transport-meta-input" value="${esc(startTime)}"
                 onchange="updateTransport(${idx},'startTime',this.value); refreshTransportTravelTime(${idx})">
        </div>
        <div class="transport-datetime-sep">→</div>
        <div class="transport-datetime-group">
          <label class="field-label">Finish Date</label>
          <input type="date" class="transport-meta-input" value="${esc(endDate)}"
                 onchange="updateTransport(${idx},'endDate',this.value); refreshTransportTravelTime(${idx})">
        </div>
        <div class="transport-datetime-group">
          <label class="field-label">Finish Time</label>
          <input type="time" class="transport-meta-input" value="${esc(endTime)}"
                 onchange="updateTransport(${idx},'endTime',this.value); refreshTransportTravelTime(${idx})">
        </div>
      </div>

      <div class="transport-travel-time-row" id="transport-tt-${idx}">${travelTimeHtml}</div>

      <div class="transport-meta-row">
        <div class="transport-meta-group">
          <label class="field-label">Cost (${getLocalCurrency()})</label>
          <input type="number" class="transport-meta-input" value="${parseTransportCost(t.cost) || ''}"
                 placeholder="0" min="0" step="0.01"
                 oninput="updateTransport(${idx},'cost',parseFloat(this.value)||0); refreshTransportCostFx(${idx})">
          <div class="transport-cost-fx" id="transport-cost-fx-${idx}"></div>
        </div>
        <div class="transport-meta-group">
          <label class="field-label">Ref #</label>
          <input type="text" class="transport-meta-input" value="${esc(t.bookingRef)}"
                 placeholder="Booking ref" onchange="updateTransport(${idx},'bookingRef',this.value)">
        </div>
      </div>

      <div class="activity-field">
        <label class="field-label">Booking URL</label>
        <div class="booking-url-wrap">
          <input type="text" class="activity-search booking-url-input" value="${esc(t.bookingUrl)}"
                 placeholder="https://booking.com/..."
                 id="transport-url-${idx}"
                 oninput="updateTransport(${idx},'bookingUrl',this.value); refreshTransportUrlBtn(${idx})">
          ${t.bookingUrl ? `<a class="btn-booking-link" id="transport-url-btn-${idx}" href="${esc(t.bookingUrl)}" target="_blank" rel="noopener">🔗 Open</a>` : `<a class="btn-booking-link btn-booking-link--hidden" id="transport-url-btn-${idx}" href="#" target="_blank" rel="noopener">🔗 Open</a>`}
        </div>
      </div>

      <div class="activity-field">
        <label class="field-label">Notes</label>
        <textarea class="activity-notes-input"
                  placeholder="Pickup details, platform, luggage, booking instructions…"
                  onchange="updateTransport(${idx},'notes',this.value)">${esc(t.notes)}</textarea>
      </div>

      <div class="activity-actions">
        <button class="btn-directions" onclick="openDirections(${idx})">🗺️ Get Directions</button>
        <button class="btn-map-link"   onclick="goToMap('transport',${idx})">📍 View on map</button>
      </div>
    </div>`;
}

function refreshTransportUrlBtn(idx) {
  const input = document.getElementById(`transport-url-${idx}`);
  const btn   = document.getElementById(`transport-url-btn-${idx}`);
  if (!input || !btn) return;
  const url = input.value.trim();
  if (url) {
    btn.href = url;
    btn.classList.remove('btn-booking-link--hidden');
  } else {
    btn.href = '#';
    btn.classList.add('btn-booking-link--hidden');
  }
}

function refreshActivityUrlBtn(idx) {
  const input = document.getElementById(`activity-url-${idx}`);
  const btn   = document.getElementById(`activity-url-btn-${idx}`);
  if (!input || !btn) return;
  const url = input.value.trim();
  if (url) {
    btn.href = url;
    btn.classList.remove('btn-booking-link--hidden');
  } else {
    btn.href = '#';
    btn.classList.add('btn-booking-link--hidden');
  }
}

function refreshAccomUrlBtn(idx) {
  const input = document.getElementById(`accom-url-${idx}`);
  const btn   = document.getElementById(`accom-url-btn-${idx}`);
  if (!input || !btn) return;
  const url = input.value.trim();
  if (url) {
    btn.href = url;
    btn.classList.remove('btn-booking-link--hidden');
  } else {
    btn.href = '#';
    btn.classList.add('btn-booking-link--hidden');
  }
}

function refreshTransportTravelTime(idx) {
  const segment = TRIP_DATA.sections.find(s => s.id === currentSegmentId);
  if (!segment || !segment.transports) return;
  const t = segment.transports[idx];
  if (!t) return;
  const duration = calcTransportDuration(t.startDate, t.startTime, t.endDate, t.endTime);
  const el = document.getElementById(`transport-tt-${idx}`);
  if (!el) return;
  el.innerHTML = duration
    ? `<div class="transport-travel-time">⏱ Travel time: <strong>${duration}</strong></div>`
    : `<div class="transport-travel-time transport-travel-time--empty">⏱ Travel time calculated from start &amp; finish</div>`;
}

function addTransport() {
  const segment = TRIP_DATA.sections.find(s => s.id === currentSegmentId);
  if (!segment) return;
  if (!segment.transports) segment.transports = [];
  segment.transports.push({
    id: Date.now(),
    title: '',
    mode: 'rental_car',
    from: '',
    to: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    cost: '',
    bookingRef: '',
    bookingUrl: '',
    notes: '',
  });
  renderTransportContent(segment);
  Storage.saveTripData(TRIP_DATA);
  showSavedIndicator('Transport added');
  syncTransportsToBudget();
}

function removeTransport(idx) {
  const segment = TRIP_DATA.sections.find(s => s.id === currentSegmentId);
  if (!segment || !segment.transports) return;
  segment.transports.splice(idx, 1);
  renderTransportContent(segment);
  Storage.saveTripData(TRIP_DATA);
  showSavedIndicator('Transport removed');
  syncTransportsToBudget();
}

function updateTransport(idx, field, value) {
  const segment = TRIP_DATA.sections.find(s => s.id === currentSegmentId);
  if (!segment || !segment.transports || !segment.transports[idx]) return;
  segment.transports[idx][field] = value;
  Storage.saveTripData(TRIP_DATA);
  showSavedIndicator();
  syncTransportsToBudget();
}

function openDirections(idx) {
  const segment = TRIP_DATA.sections.find(s => s.id === currentSegmentId);
  if (!segment || !segment.transports || !segment.transports[idx]) return;
  const t = segment.transports[idx];
  if (!t.from || !t.to) {
    showToast('Enter both a start and end location to get directions.');
    return;
  }
  window.open(buildDirectionsUrl(t), '_blank');
}

function goToMap(type, idx) {
  // If map tab is not yet active, set a pending focus and switch
  if (typeof focusMapMarker === 'function') {
    _pendingFocusType = type;
    _pendingFocusIdx  = idx;
  }
  switchSegmentTab(3);
}

// ─── Accommodation ────────────────────────────────────────────────────────────

function renderAccommodationContent(segment) {
  const container = document.getElementById('accommodationContent');
  if (!container) return;

  if (!segment.accommodations || segment.accommodations.length === 0) {
    container.innerHTML = '<div class="itinerary-empty">No accommodation added yet. Click + Add accommodation to get started.</div>';
    return;
  }

  container.innerHTML = segment.accommodations.map((a, idx) => buildAccommodationCard(a, idx)).join('');
}

function buildAccommodationCard(a, idx) {
  const esc = s => UIComponents.escapeHtml(s || '');
  return `
    <div class="accom-card" id="accom-card-${idx}">
      <div class="accom-card-header">
        <span class="accom-item-num">${idx + 1}</span>
        <input type="text" class="accom-name-input" value="${esc(a.name)}"
               placeholder="Property name" onchange="updateAccommodation(${idx},'name',this.value)">
        <button class="btn-remove-activity" onclick="removeAccommodation(${idx})">×</button>
      </div>

      <div class="accom-dates-row">
        <div class="accom-date-group">
          <label class="field-label">Check-in</label>
          <input type="date" class="accom-date-input" value="${esc(a.checkIn)}"
                 onchange="updateAccommodation(${idx},'checkIn',this.value)">
        </div>
        <div class="accom-date-group">
          <label class="field-label">Check-out</label>
          <input type="date" class="accom-date-input" value="${esc(a.checkOut)}"
                 onchange="updateAccommodation(${idx},'checkOut',this.value)">
        </div>
        <div class="accom-date-group">
          <label class="field-label">Cost</label>
          <input type="text" class="accom-cost-input" value="${esc(a.cost)}"
                 placeholder="e.g. $250/night" onchange="updateAccommodation(${idx},'cost',this.value)">
        </div>
      </div>

      <div class="activity-field">
        <label class="field-label">Location</label>
        <div class="location-search-wrap">
          <input type="text"
                 id="loc-input-accommodation-${idx}"
                 class="activity-search"
                 placeholder="🔍 Search property location"
                 value="${esc(a.location)}"
                 oninput="locationSearchInput(this,'accommodation',${idx})"
                 onblur="closeLocationDropdown('loc-drop-accommodation-${idx}')">
          <div class="location-dropdown" id="loc-drop-accommodation-${idx}"></div>
        </div>
      </div>

      <div class="activity-field">
        <label class="field-label">Booking URL</label>
        <div class="booking-url-wrap">
          <input type="text" class="activity-search booking-url-input" value="${esc(a.url)}"
                 placeholder="https://booking.com/..."
                 id="accom-url-${idx}"
                 oninput="updateAccommodation(${idx},'url',this.value); refreshAccomUrlBtn(${idx})">
          ${a.url ? `<a class="btn-booking-link" id="accom-url-btn-${idx}" href="${esc(a.url)}" target="_blank" rel="noopener">🔗 Open</a>` : `<a class="btn-booking-link btn-booking-link--hidden" id="accom-url-btn-${idx}" href="#" target="_blank" rel="noopener">🔗 Open</a>`}
        </div>
      </div>

      <div class="activity-field">
        <label class="field-label">Notes</label>
        <textarea class="activity-notes-input" placeholder="Check-in instructions, parking, contact..."
                  onchange="updateAccommodation(${idx},'notes',this.value)">${esc(a.notes)}</textarea>
      </div>

      <div class="activity-actions">
        <button class="btn-map-link" onclick="goToMap('accommodation',${idx})">📍 View on map</button>
      </div>
    </div>`;
}

function addAccommodation() {
  const segment = TRIP_DATA.sections.find(s => s.id === currentSegmentId);
  if (!segment) return;
  if (!segment.accommodations) segment.accommodations = [];
  segment.accommodations.push({
    id: Date.now(),
    name: '',
    checkIn: '',
    checkOut: '',
    cost: '',
    url: '',
    location: '',
    notes: '',
  });
  renderAccommodationContent(segment);
  Storage.saveTripData(TRIP_DATA);
  showSavedIndicator('Accommodation added');
}

function removeAccommodation(idx) {
  const segment = TRIP_DATA.sections.find(s => s.id === currentSegmentId);
  if (!segment || !segment.accommodations) return;
  segment.accommodations.splice(idx, 1);
  renderAccommodationContent(segment);
  Storage.saveTripData(TRIP_DATA);
  showSavedIndicator('Accommodation removed');
}

function updateAccommodation(idx, field, value) {
  const segment = TRIP_DATA.sections.find(s => s.id === currentSegmentId);
  if (!segment || !segment.accommodations || !segment.accommodations[idx]) return;
  segment.accommodations[idx][field] = value;
  Storage.saveTripData(TRIP_DATA);
  showSavedIndicator();
}

// ─── Import ───────────────────────────────────────────────────────────────────

function handleImportFile(input) {
  const file = input.files[0];
  input.value = '';
  if (!file) return;
  if (typeof XLSX === 'undefined') {
    alert('Import library not loaded. Please check your internet connection and try again.');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellDates: true });
      importTripFromExcel(wb);
    } catch (err) {
      console.error('Import error:', err);
      alert('Could not read the file. Please make sure it was exported from this app.');
    }
  };
  reader.readAsArrayBuffer(file);
}

function xlDateStr(val) {
  if (!val) return '';
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

function xlNum(val) { return parseFloat(val) || 0; }
function xlStr(val) { return val == null ? '' : String(val); }

function importTripFromExcel(wb) {
  const rows = name => {
    const ws = wb.Sheets[name];
    return ws ? XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) : [];
  };

  // ── Trip Summary (key-value from row 3 onward) ────────────────────────
  const sumMap = {};
  rows('Trip Summary').slice(2).forEach(r => { if (r[0]) sumMap[xlStr(r[0])] = r[1]; });

  // ── Sections ─────────────────────────────────────────────────────────
  const sections = rows('Sections').slice(1).filter(r => r[1]).map((r, i) => ({
    id: Date.now() + i + 1,
    number: i + 1,
    name:       xlStr(r[1]),
    startDate:  xlDateStr(r[2]),
    endDate:    xlDateStr(r[3]),
    nights:     xlNum(r[4]),
    cost:       xlStr(r[5]),
    highlights: xlStr(r[7]),
    location:   xlStr(r[8]),
    activities:     [],
    accommodations: [],
    transports:     [],
  }));

  // ── Itinerary → activities ────────────────────────────────────────────
  rows('Itinerary').slice(1).filter(r => r[5]).forEach((r, i) => {
    const sec = sections.find(s => s.name === xlStr(r[0]));
    if (!sec) return;
    const durStr = xlStr(r[4]);
    const hM = durStr.match(/(\d+)h/); const mM = durStr.match(/(\d+)m/);
    sec.activities.push({
      id:           sec.activities.length + 1,
      day:          xlNum(r[1]) || 1,
      priority:     xlNum(r[2]) || 1,
      time:         xlStr(r[3]) || '09:00',
      durationHrs:  hM ? parseInt(hM[1]) : 0,
      durationMins: mM ? parseInt(mM[1]) : 0,
      title:         xlStr(r[5]),
      notes:         xlStr(r[6]),
      location:      xlStr(r[7]),
    });
  });

  // ── Accommodation ─────────────────────────────────────────────────────
  rows('Accommodation').slice(1).filter(r => r[1]).forEach(r => {
    const sec = sections.find(s => s.name === xlStr(r[0]));
    if (!sec) return;
    sec.accommodations.push({
      id:       sec.accommodations.length + 1,
      name:     xlStr(r[1]),
      checkIn:  xlDateStr(r[2]),
      checkOut: xlDateStr(r[3]),
      cost:     xlStr(r[5]),
      url:      xlStr(r[6]),
      location: xlStr(r[7]),
    });
  });

  // ── Budget ────────────────────────────────────────────────────────────
  const catMap = {
    'Accommodation': 'accommodation', 'Flights': 'flights',
    'Food & Dining': 'food',         'Activities': 'activities',
    'Transport': 'transport',        'Other': 'other',
  };
  const cats = { accommodation: 0, flights: 0, food: 0, activities: 0, transport: 0, other: 0 };
  let budgetTotal = 0;
  rows('Budget').slice(2).forEach(r => {
    const key = xlStr(r[0]);
    if (key === 'TOTAL BUDGET') { budgetTotal = xlNum(r[1]); }
    else if (catMap[key]) { cats[catMap[key]] = xlNum(r[1]); }
  });

  // ── Settings ──────────────────────────────────────────────────────────
  const setMap = {};
  rows('Settings').slice(2).forEach(r => { if (r[0]) setMap[xlStr(r[0])] = r[1]; });

  // ── Build trip ────────────────────────────────────────────────────────
  const newTrip = {
    id:          Date.now(),
    title:       xlStr(sumMap['Trip Title'] || setMap['Trip Title'] || 'Imported Trip'),
    destination: xlStr(sumMap['Destination'] || setMap['Destination'] || ''),
    startDate:   xlDateStr(sumMap['Trip Start Date'] || ''),
    endDate:     xlDateStr(sumMap['Trip End Date'] || ''),
    nights:      xlNum(sumMap['Total Nights'] || 0),
    budget:      { total: budgetTotal, currency: xlStr(sumMap['Currency'] || setMap['Default Currency'] || 'AUD'), categories: cats },
    sections,
  };

  // ── Save and switch ───────────────────────────────────────────────────
  Storage.saveTrip(newTrip);
  const tripsList = Storage.getTripsList();
  tripsList.push({ id: newTrip.id, title: newTrip.title, destination: newTrip.destination });
  Storage.saveTripsList(tripsList);
  Storage.setActiveTripId(newTrip.id);
  currentTripId = newTrip.id;
  Object.assign(TRIP_DATA, newTrip);
  tripManager.data = TRIP_DATA;

  renderTripSelector();
  updateHeader();
  renderSummary();
  renderTripSummaryBar();
  renderBudget();

  if (TRIP_DATA.sections.length > 0) {
    selectSegment(TRIP_DATA.sections[0].id, 1);
  } else {
    document.getElementById('segmentTabsContainer').style.display = 'none';
  }

  showSavedIndicator(`"${newTrip.title}" imported`);
}

document.addEventListener('DOMContentLoaded', initApp);
