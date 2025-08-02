(function () {
    'use strict';// Get API key and optional config from window variables or script src
    const script = document.currentScript || document.querySelector('script[src*="tracking.js"]');
    const scriptSrc = script ? script.src : '';
    const urlParams = new URLSearchParams(scriptSrc.split('?')[1]);
    
    // First try to get API key and endpoint from window variables (recommended approach)
    let apiKey = window.CBMS_API_KEY;
    let apiUrl = window.CBMS_API_ENDPOINT || 'https://cbmsystem.vercel.app/api/track';
    
    // Fall back to URL parameters if window variables aren't set
    if (!apiKey) {
        apiKey = urlParams.get('key');
    }
    
    if (urlParams.get('api')) {
        apiUrl = urlParams.get('api');
    }
    
    const debug = urlParams.get('debug') === 'true' || window.CBMS_DEBUG === true;

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
        debug: debug,
    };

    // Initialize debug UI if in debug mode
    if (config.debug) {
        initDebugUI();
    }

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
    }// Debug UI
    function initDebugUI() {
        console.log('CBMS: Debug mode enabled');

        // Create debug panel
        const panel = document.createElement('div');
        panel.style.position = 'fixed';
        panel.style.bottom = '10px';
        panel.style.right = '10px';
        panel.style.width = '300px';
        panel.style.maxHeight = '400px';
        panel.style.overflow = 'auto';
        panel.style.background = 'rgba(0, 0, 0, 0.8)';
        panel.style.color = '#00ff00';
        panel.style.padding = '10px';
        panel.style.borderRadius = '5px';
        panel.style.fontFamily = 'monospace';
        panel.style.fontSize = '12px';
        panel.style.zIndex = '9999';

        // Add header
        panel.innerHTML = '<h3 style="margin: 0 0 10px 0; color: #fff;">CBMS Debug Console</h3>' +
            '<div id="cbms-event-log" style="max-height: 300px; overflow-y: auto;"></div>' +
            '<div style="margin-top: 10px; display: flex; justify-content: space-between;">' +
            '<button id="cbms-toggle-btn" style="padding: 5px; cursor: pointer;">Hide</button>' +
            '<button id="cbms-test-btn" style="padding: 5px; cursor: pointer;">Test Event</button>' +
            '<button id="cbms-clear-btn" style="padding: 5px; cursor: pointer;">Clear</button>' +
            '</div>';

        document.body.appendChild(panel);

        // Event log element
        const eventLog = document.getElementById('cbms-event-log');

        // Toggle button
        const toggleBtn = document.getElementById('cbms-toggle-btn');
        let isVisible = true;

        toggleBtn.addEventListener('click', () => {
            if (isVisible) {
                eventLog.style.display = 'none';
                toggleBtn.textContent = 'Show';
                isVisible = false;
            } else {
                eventLog.style.display = 'block';
                toggleBtn.textContent = 'Hide';
                isVisible = true;
            }
        });

        // Test button
        const testBtn = document.getElementById('cbms-test-btn');
        testBtn.addEventListener('click', () => {
            trackEvent('test_event', { debug: true, manual: true });
            logEvent('Manual test event triggered');
        });

        // Clear button
        const clearBtn = document.getElementById('cbms-clear-btn');
        clearBtn.addEventListener('click', () => {
            eventLog.innerHTML = '';
        });

        // Override console.log for CBMS messages
        const originalLog = console.log;
        console.log = (...args) => {
            originalLog(...args);
            if (args[0] && typeof args[0] === 'string' && args[0].startsWith('CBMS:')) {
                logEvent(args.join(' '));
            }
        };

        // Log events to the panel
        window.cbmsLogEvent = logEvent;

        function logEvent(message) {
            const time = new Date().toLocaleTimeString();
            const logItem = document.createElement('div');
            logItem.style.borderBottom = '1px solid #333';
            logItem.style.padding = '5px 0';
            logItem.innerHTML = `<span style="color: #999;">[${time}]</span> ${message}`;

            eventLog.appendChild(logItem);
            eventLog.scrollTop = eventLog.scrollHeight;
        }

        // Monkey patch trackEvent to log events
        const originalTrackEvent = trackEvent;
        trackEvent = function (eventType, data = {}) {
            logEvent(`Event: ${eventType}`);
            return originalTrackEvent(eventType, data);
        };

        // Monkey patch sendBatch to log network activity
        const originalSendBatch = sendBatch;
        sendBatch = async function () {
            logEvent(`Sending batch of ${eventQueue.length} events...`);
            try {
                await originalSendBatch();
                logEvent('Batch sent successfully');
            } catch (error) {
                logEvent(`Error sending batch: ${error.message}`);
                throw error;
            }
        };
    }

    // Public API
    window.CBMS = {
        track: trackEvent,
        init: init,
        config: config,
        debug: function () {
            config.debug = true;
            initDebugUI();
        }
    };

    // Auto-initialize if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(); 