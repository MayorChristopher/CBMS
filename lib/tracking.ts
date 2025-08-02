import { supabase } from "./supabase"

export interface TrackingEvent {
    event_type: "page_view" | "click" | "form_submit" | "scroll" | "session_start" | "session_end"
    page_url: string
    element_id?: string
    metadata?: Record<string, any>
    timestamp?: string
}

class TrackingService {
    private sessionId: string | null = null
    private isInitialized = false

    async initialize() {
        if (this.isInitialized) return

        // Generate session ID
        this.sessionId = this.generateSessionId()

        // Start session
        await this.trackSessionStart()

        // Set up event listeners
        this.setupEventListeners()

        this.isInitialized = true
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    private async trackSessionStart() {
        const event: TrackingEvent = {
            event_type: "session_start",
            page_url: window.location.href,
            metadata: {
                session_id: this.sessionId,
                user_agent: navigator.userAgent,
                screen_resolution: `${screen.width}x${screen.height}`,
                referrer: document.referrer,
                timestamp: new Date().toISOString()
            }
        }

        await this.sendEvent(event)
    }

    private setupEventListeners() {
        // Track page views
        this.trackPageView()

        // Track clicks
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement
            if (target) {
                this.trackClick(target)
            }
        })

        // Track form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target as HTMLFormElement
            if (form) {
                this.trackFormSubmit(form)
            }
        })

        // Track scroll events
        let scrollTimeout: NodeJS.Timeout
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout)
            scrollTimeout = setTimeout(() => {
                this.trackScroll()
            }, 100)
        })

        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.trackSessionEnd()
            }
        })

        // Track before unload
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd()
        })
    }

    private trackPageView() {
        const event: TrackingEvent = {
            event_type: "page_view",
            page_url: window.location.href,
            metadata: {
                title: document.title,
                session_id: this.sessionId,
                timestamp: new Date().toISOString()
            }
        }

        this.sendEvent(event)
    }

    private trackClick(element: HTMLElement) {
        const event: TrackingEvent = {
            event_type: "click",
            page_url: window.location.href,
            element_id: element.id || element.className || element.tagName,
            metadata: {
                text: element.textContent?.trim().substring(0, 50),
                tag_name: element.tagName,
                classes: element.className,
                session_id: this.sessionId,
                timestamp: new Date().toISOString()
            }
        }

        this.sendEvent(event)
    }

    private trackFormSubmit(form: HTMLFormElement) {
        const event: TrackingEvent = {
            event_type: "form_submit",
            page_url: window.location.href,
            element_id: form.id || form.className,
            metadata: {
                form_action: form.action,
                form_method: form.method,
                form_fields: Array.from(form.elements).map(el => ({
                    name: (el as HTMLInputElement).name,
                    type: (el as HTMLInputElement).type
                })),
                session_id: this.sessionId,
                timestamp: new Date().toISOString()
            }
        }

        this.sendEvent(event)
    }

    private trackScroll() {
        const scrollPercentage = Math.round(
            (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        )

        const event: TrackingEvent = {
            event_type: "scroll",
            page_url: window.location.href,
            metadata: {
                scroll_percentage: scrollPercentage,
                scroll_y: window.scrollY,
                session_id: this.sessionId,
                timestamp: new Date().toISOString()
            }
        }

        this.sendEvent(event)
    }

    private async trackSessionEnd() {
        const event: TrackingEvent = {
            event_type: "session_end",
            page_url: window.location.href,
            metadata: {
                session_id: this.sessionId,
                session_duration: this.sessionId && this.sessionId.startsWith('session_')
                  ? Date.now() - Number(this.sessionId.split('_')[1])
                  : null,
                timestamp: new Date().toISOString()
            }
        }

        try {
            await this.sendEvent(event)
        } catch (error) {
            // Log error safely and with more context
            console.error('Error sending session_end event:', error instanceof Error ? error.message : error)
        }
    }private async sendEvent(event: TrackingEvent) {
        try {
            // Validate Supabase URL and key are set
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            
            if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
                // Silently skip tracking if Supabase isn't configured properly
                return;
            }
            
            // Get current user
            const { data } = await supabase.auth.getUser();
            const user = data?.user;

            // Prepare event data
            // Only send a UUID for session_id if it matches UUID format, else null
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            const sessionIdForDb = (this.sessionId && uuidRegex.test(this.sessionId)) ? this.sessionId : null;
            // Only set customer_id if you have a real customer record (not just a Supabase auth user)
            // For now, always set to null to avoid FK errors
            const eventData = {
                session_id: sessionIdForDb,
                customer_id: null,
                event_type: event.event_type,
                page_url: event.page_url,
                element_id: event.element_id,
                timestamp: event.timestamp || new Date().toISOString(),
                metadata: event.metadata
            };

            // Send to Supabase
            const { error } = await supabase
                .from('activities')
                .insert([eventData]);

            if (error) {
                // Improved error logging: stringified error object for more details
                try {
                    console.error('Error tracking event:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
                } catch (e) {
                    console.error('Error tracking event:', error);
                }
                // Log more details about the error without exposing sensitive data
                if (error.code) {
                    console.debug(`Error code: ${error.code}, message: ${error.message}`);
                    // Common error codes and troubleshooting tips
                    if (error.code === '42P01') {
                        console.warn('Table "activities" might not exist. Run database setup scripts.');
                    } else if (error.code === '23503') {
                        console.warn('Foreign key constraint failed. Check that referenced records exist.');
                    } else if (error.code.startsWith('23')) {
                        console.warn('Database constraint violation. Check column data types and constraints.');
                    } else if (error.code.startsWith('28')) {
                        console.warn('Authentication issue. Check your API keys and permissions.');
                    }
                }
            }
        } catch (error) {
            // Log error safely
            console.error('Error in tracking service:', error instanceof Error ? error.message : 'Unknown error');
        }
    }

    // Public methods for manual tracking
    async trackCustomEvent(eventType: string, metadata?: Record<string, any>) {
        const event: TrackingEvent = {
            event_type: eventType as any,
            page_url: window.location.href,
            metadata: {
                ...metadata,
                session_id: this.sessionId,
                timestamp: new Date().toISOString()
            }
        }

        await this.sendEvent(event)
    }
}

// Create singleton instance
export const trackingService = new TrackingService()

// Initialize tracking when the script loads
if (typeof window !== 'undefined') {
    trackingService.initialize()
} 