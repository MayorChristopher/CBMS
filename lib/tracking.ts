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
                session_duration: Date.now() - (this.sessionId ? parseInt(this.sessionId.split('_')[1]) : 0),
                timestamp: new Date().toISOString()
            }
        }

        await this.sendEvent(event)
    }

    private async sendEvent(event: TrackingEvent) {
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()

            // Prepare event data
            const eventData = {
                session_id: this.sessionId,
                customer_id: user?.id || null,
                event_type: event.event_type,
                page_url: event.page_url,
                element_id: event.element_id,
                timestamp: event.timestamp || new Date().toISOString(),
                metadata: event.metadata
            }

            // Send to Supabase
            const { error } = await supabase
                .from('activities')
                .insert([eventData])

            if (error) {
                console.error('Error tracking event:', error)
            }
        } catch (error) {
            console.error('Error in tracking service:', error)
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