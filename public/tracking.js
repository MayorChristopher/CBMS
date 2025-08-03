// tracking.js - CBMS Universal Tracking Script
// Ensure window.CBMS_WEBSITE_ID is set in the embedding site before loading this script

(function() {
  if (!window.CBMS_WEBSITE_ID) {
    console.error('CBMS: window.CBMS_WEBSITE_ID is not set! Tracking will not work.');
    return;
  }

  function sendEvent(event) {
    // Always include website_id
    event.website_id = window.CBMS_WEBSITE_ID;

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: [event] })
    }).catch(err => {
      console.error('CBMS: Failed to send tracking event', err);
    });
  }

  // Example: Track a page view
  function trackPageView() {
    sendEvent({
      event_type: 'page_view',
      session_id: getSessionId(),
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      api_key: window.CBMS_API_KEY || '',
      metadata: {
        user_agent: navigator.userAgent,
        referer: document.referrer
      }
    });
  }

  // Example: Track a click
  function trackClick(elementId) {
    sendEvent({
      event_type: 'click',
      session_id: getSessionId(),
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      api_key: window.CBMS_API_KEY || '',
      element_id: elementId,
      metadata: {
        user_agent: navigator.userAgent,
        referer: document.referrer
      }
    });
  }

  // Session ID management (simple example)
  function getSessionId() {
    let sid = sessionStorage.getItem('cbms_session_id');
    if (!sid) {
      sid = Math.random().toString(36).substring(2) + Date.now();
      sessionStorage.setItem('cbms_session_id', sid);
    }
    return sid;
  }

  // Expose tracking functions globally
  window.CBMS = {
    sendEvent,
    trackPageView,
    trackClick
  };

  // Auto-track page view on load
  document.addEventListener('DOMContentLoaded', trackPageView);
})();
