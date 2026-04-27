// TRIP-PLANNER.JS - Trip Planner Module
// Stub file to prevent 404 errors in console

/**
 * Initialize Trip Planner
 */
function initTripPlanner() {
  console.log('Trip Planner initialized');
  // This module is currently integrated into main.js
  // The trip planning features are accessible from the main interface
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTripPlanner);
} else {
  initTripPlanner();
}
