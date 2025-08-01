(function () {
    'use strict';

    // Get API key and optional config from script src
    const script = document.currentScript || document.querySelector('script[src*="tracking.js"]');
    const scriptSrc = script ? script.src : '';
    const urlParams = new URLSearchParams(scriptSrc.split('?')[1]);
    const apiKey = urlParams.get('key');
    const apiUrl = urlParams.get('api') || 'https://cbmsystem.vercel.app/api/track'; // Production URL

    if (!apiKey) {
        console.error('CBMS: No API key provided. Add ?key=YOUR_API_KEY to the script URL');
        return;
    }

    // Configuration
    const config = {
        apiUrl: apiUrl,
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        batchSize: 10,
        batchTimeout: 5000, // 5 seconds
    };

    // State
    let sessionId = null;
    let sessionStart = null;
    let eventQueue = [];
    let batchTimer = null;

    // Initialize session
    function initSession() {
        sessionId = generateSessionId();
        sessionStart = new Date().toISOString();

        // Track session start
        trackEvent('session_start', {
            session_id: sessionId,
            page_url: window.location.href,
            referrer: document.referrer,
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
        });
    }

    // Generate unique session ID
    function generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Track an event
    function trackEvent(eventType, data = {}) {
        const event = {
            event_type: eventType,
            session_id: sessionId,
            page_url: window.location.href,
            timestamp: new Date().toISOString(),
            api_key: apiKey,
            ...data
        };

        eventQueue.push(event);

        // Send batch if queue is full
        if (eventQueue.length >= config.batchSize) {
            sendBatch();
        } else if (!batchTimer) {
            // Set timer to send batch after timeout
            batchTimer = setTimeout(sendBatch, config.batchTimeout);
        }
    }

    // Send batch of events
    async function sendBatch() {
        if (eventQueue.length === 0) return;

        const events = [...eventQueue];
        eventQueue = [];

        if (batchTimer) {
            clearTimeout(batchTimer);
            batchTimer = null;
        }

        try {
            const response = await fetch(config.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ events }),
            });

            if (!response.ok) {
                console.error('CBMS: Failed to send events:', response.status, response.statusText);
                // Re-queue events if they failed to send
                eventQueue.unshift(...events);
            } else {
                console.log('CBMS: Successfully sent', events.length, 'events');
            }
        } catch (error) {
            console.error('CBMS: Error sending events:', error);
            // Re-queue events if they failed to send
            eventQueue.unshift(...events);
        }
    }

    // Track page views
    function trackPageView() {
        trackEvent('page_view', {
            title: document.title,
            referrer: document.referrer,
        });
    }

    // Track clicks
    function trackClick(event) {
        const target = event.target;
        const element = {
            tag: target.tagName.toLowerCase(),
            id: target.id || null,
            class: target.className || null,
            text: target.textContent?.substring(0, 100) || null,
        };

        trackEvent('click', {
            element: element,
            x: event.clientX,
            y: event.clientY,
        });
    }

    // Track form submissions
    function trackFormSubmit(event) {
        const form = event.target;
        const formData = {
            action: form.action || null,
            method: form.method || 'GET',
            id: form.id || null,
            class: form.className || null,
        };

        trackEvent('form_submit', {
            form: formData,
        });
    }

    // Track scroll events (throttled)
    let scrollTimeout;
    function trackScroll() {
        if (scrollTimeout) return;

        scrollTimeout = setTimeout(() => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );

            trackEvent('scroll', {
                scroll_percent: scrollPercent,
                scroll_y: window.scrollY,
            });

            scrollTimeout = null;
        }, 1000);
    }

    // Track time on page
    function trackTimeOnPage() {
        if (sessionStart) {
            const timeOnPage = Date.now() - new Date(sessionStart).getTime();
            trackEvent('time_on_page', {
                duration_ms: timeOnPage,
            });
        }
    }

    // Initialize tracking
    function init() {
        console.log('CBMS: Initializing tracking with API URL:', config.apiUrl);

        // Start session
        initSession();

        // Track initial page view
        trackPageView();

        // Add event listeners
        document.addEventListener('click', trackClick, true);
        document.addEventListener('submit', trackFormSubmit, true);
        window.addEventListener('scroll', trackScroll, { passive: true });

        // Track time on page before unload
        window.addEventListener('beforeunload', trackTimeOnPage);

        // Track session end
        window.addEventListener('beforeunload', () => {
            trackEvent('session_end', {
                session_duration_ms: Date.now() - new Date(sessionStart).getTime(),
            });
            sendBatch(); // Force send on unload
        });

        // Send any remaining events periodically
        setInterval(sendBatch, config.batchTimeout * 2);
    }

    // Public API
    window.CBMS = {
        track: trackEvent,
        init: init,
        config: config,
    };

    // Auto-initialize if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(); 