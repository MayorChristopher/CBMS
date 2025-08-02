import { supabase } from "./supabase"

export interface EngagementMetrics {
    engagement_score: number
    bounce_rate: number
    conversion_rate: number
    avg_session_duration: number
    pages_per_session: number
    return_visitor_rate: number
}

export interface BehaviorPattern {
    pattern_type: "click_pattern" | "scroll_pattern" | "navigation_pattern" | "form_completion"
    confidence: number
    description: string
    metadata: Record<string, any>
}

export interface ConversionFunnel {
    stage: string
    visitors: number
    conversions: number
    conversion_rate: number
    drop_off_rate: number
}

class AnalyticsEngine {
    async calculateEngagementMetrics(customerId?: string, timeRange: string = '7d'): Promise<EngagementMetrics> {
        try {
            let query = supabase
                .from('activities')
                .select('*')
                .gte('timestamp', this.getTimeRangeDate(timeRange));
            if (customerId) {
                query = query.eq('customer_id', customerId);
            }
            const { data: activities, error } = await query;

            if (error) throw error

            const metrics = this.processEngagementData(activities || [])
            return metrics
        } catch (error) {
            console.error('Error calculating engagement metrics:', error)
            return this.getDefaultMetrics()
        }
    }

    async identifyBehaviorPatterns(customerId?: string): Promise<BehaviorPattern[]> {
        try {
            let query = supabase
                .from('activities')
                .select('*')
                .order('timestamp', { ascending: true });
            if (customerId) {
                query = query.eq('customer_id', customerId);
            }
            const { data: activities, error } = await query;

            if (error) throw error

            return this.analyzeBehaviorPatterns(activities || [])
        } catch (error) {
            console.error('Error identifying behavior patterns:', error)
            return []
        }
    }

    async generateConversionFunnel(funnelSteps: string[]): Promise<ConversionFunnel[]> {
        try {
            const { data: activities, error } = await supabase
                .from('activities')
                .select('*')
                .in('event_type', ['page_view', 'form_submit', 'click'])
                .order('timestamp', { ascending: true })

            if (error) throw error

            return this.analyzeConversionFunnel(activities || [], funnelSteps)
        } catch (error) {
            console.error('Error generating conversion funnel:', error)
            return []
        }
    }

    async calculateDropOffRates(): Promise<Record<string, number>> {
        try {
            const { data: activities, error } = await supabase
                .from('activities')
                .select('*')
                .eq('event_type', 'page_view')

            if (error) throw error

            return this.analyzeDropOffRates(activities || [])
        } catch (error) {
            console.error('Error calculating drop-off rates:', error)
            return {}
        }
    }

    private processEngagementData(activities: any[]): EngagementMetrics {
        if (activities.length === 0) return this.getDefaultMetrics()

        const sessions = this.groupBySession(activities)
        const totalSessions = Object.keys(sessions).length
        const totalActivities = activities.length

        // Calculate engagement score based on activity diversity
        const activityTypes = new Set(activities.map(a => a.event_type))
        const engagementScore = Math.min(100, (activityTypes.size / 5) * 100)

        // Calculate bounce rate (sessions with only 1 page view)
        const bounceSessions = Object.values(sessions).filter(session =>
            session.filter(a => a.event_type === 'page_view').length === 1
        ).length
        const bounceRate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0

        // Calculate average session duration
        const sessionDurations = Object.values(sessions).map(session => {
            const timestamps = session.map(a => new Date(a.timestamp).getTime())
            return Math.max(...timestamps) - Math.min(...timestamps)
        })
        const avgSessionDuration = sessionDurations.length > 0
            ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length / 1000 // Convert to seconds
            : 0

        // Calculate pages per session
        const pagesPerSession = totalSessions > 0
            ? activities.filter(a => a.event_type === 'page_view').length / totalSessions
            : 0

        // Calculate conversion rate (form submissions / total sessions)
        const conversions = activities.filter(a => a.event_type === 'form_submit').length
        const conversionRate = totalSessions > 0 ? (conversions / totalSessions) * 100 : 0

        // Calculate return visitor rate (simplified)
        const returnVisitorRate = 25 // Placeholder - would need more complex logic

        return {
            engagement_score: Math.round(engagementScore),
            bounce_rate: Math.round(bounceRate * 100) / 100,
            conversion_rate: Math.round(conversionRate * 100) / 100,
            avg_session_duration: Math.round(avgSessionDuration),
            pages_per_session: Math.round(pagesPerSession * 100) / 100,
            return_visitor_rate: returnVisitorRate
        }
    }

    private analyzeBehaviorPatterns(activities: any[]): BehaviorPattern[] {
        const patterns: BehaviorPattern[] = []

        // Analyze click patterns
        const clicks = activities.filter(a => a.event_type === 'click')
        if (clicks.length > 5) {
            const clickPattern = this.analyzeClickPattern(clicks)
            if (clickPattern) patterns.push(clickPattern)
        }

        // Analyze scroll patterns
        const scrolls = activities.filter(a => a.event_type === 'scroll')
        if (scrolls.length > 3) {
            const scrollPattern = this.analyzeScrollPattern(scrolls)
            if (scrollPattern) patterns.push(scrollPattern)
        }

        // Analyze navigation patterns
        const pageViews = activities.filter(a => a.event_type === 'page_view')
        if (pageViews.length > 2) {
            const navigationPattern = this.analyzeNavigationPattern(pageViews)
            if (navigationPattern) patterns.push(navigationPattern)
        }

        // Analyze form completion patterns
        const formSubmissions = activities.filter(a => a.event_type === 'form_submit')
        if (formSubmissions.length > 0) {
            const formPattern = this.analyzeFormCompletionPattern(formSubmissions)
            if (formPattern) patterns.push(formPattern)
        }

        return patterns
    }

    private analyzeClickPattern(clicks: any[]): BehaviorPattern | null {
        const buttonClicks = clicks.filter(c =>
            c.metadata?.tag_name === 'BUTTON' ||
            c.element_id?.includes('button') ||
            (Array.isArray(c.metadata?.classes) && c.metadata.classes.includes('btn'))
        )

        if (buttonClicks.length > 3) {
            return {
                pattern_type: "click_pattern",
                confidence: Math.min(90, buttonClicks.length * 15),
                description: `User shows preference for button interactions (${buttonClicks.length} button clicks)`,
                metadata: {
                    total_clicks: clicks.length,
                    button_clicks: buttonClicks.length,
                    preferred_elements: this.getMostClickedElements(clicks)
                }
            }
        }

        return null
    }

    private analyzeScrollPattern(scrolls: any[]): BehaviorPattern | null {
        const avgScrollDepth = scrolls.reduce((sum, s) =>
            sum + (s.metadata?.scroll_percentage || 0), 0
        ) / scrolls.length

        if (avgScrollDepth > 50) {
            return {
                pattern_type: "scroll_pattern",
                confidence: Math.min(85, avgScrollDepth),
                description: `User engages deeply with content (avg scroll depth: ${Math.round(avgScrollDepth)}%)`,
                metadata: {
                    avg_scroll_depth: Math.round(avgScrollDepth),
                    total_scroll_events: scrolls.length
                }
            }
        }

        return null
    }

    private analyzeNavigationPattern(pageViews: any[]): BehaviorPattern | null {
        const uniquePages = new Set(pageViews.map(p => p.page_url))

        if (uniquePages.size > 2) {
            return {
                pattern_type: "navigation_pattern",
                confidence: Math.min(80, uniquePages.size * 20),
                description: `User explores multiple pages (${uniquePages.size} unique pages visited)`,
                metadata: {
                    pages_visited: Array.from(uniquePages),
                    total_page_views: pageViews.length
                }
            }
        }

        return null
    }

    private analyzeFormCompletionPattern(formSubmissions: any[]): BehaviorPattern | null {
        return {
            pattern_type: "form_completion",
            confidence: 95,
            description: `User completes forms (${formSubmissions.length} form submissions)`,
            metadata: {
                forms_completed: formSubmissions.length,
                form_types: formSubmissions.map(f => f.element_id || 'unknown')
            }
        }
    }

    private analyzeConversionFunnel(activities: any[], funnelSteps: string[]): ConversionFunnel[] {
        const funnel: ConversionFunnel[] = []
        let previousVisitors = 0

        for (let i = 0; i < funnelSteps.length; i++) {
            const step = funnelSteps[i]
            const stepActivities = activities.filter(a =>
                a.page_url.includes(step) || a.element_id?.includes(step)
            )
            const visitors = new Set(stepActivities.map(a => a.customer_id || a.session_id)).size

            const conversionRate = previousVisitors > 0 ? (visitors / previousVisitors) * 100 : 100
            const dropOffRate = previousVisitors > 0 ? ((previousVisitors - visitors) / previousVisitors) * 100 : 0

            funnel.push({
                stage: step,
                visitors,
                conversions: visitors,
                conversion_rate: Math.round(conversionRate * 100) / 100,
                drop_off_rate: Math.round(dropOffRate * 100) / 100
            })

            previousVisitors = visitors
        }

        return funnel
    }

    private analyzeDropOffRates(activities: any[]): Record<string, number> {
        const pageViews = activities.filter(a => a.event_type === 'page_view')
        const pages = new Map<string, number>()

        pageViews.forEach(pv => {
            const page = pv.page_url
            pages.set(page, (pages.get(page) || 0) + 1)
        })

        const sortedPages = Array.from(pages.entries()).sort((a, b) => b[1] - a[1])
        const dropOffRates: Record<string, number> = {}

        sortedPages.forEach(([page, views], index) => {
            if (index > 0) {
                const previousViews = sortedPages[index - 1][1]
                dropOffRates[page] = Math.round(((previousViews - views) / previousViews) * 100 * 100) / 100
            }
        })

        return dropOffRates
    }

    private groupBySession(activities: any[]): Record<string, any[]> {
        const sessions: Record<string, any[]> = {}

        activities.forEach(activity => {
            const sessionId = activity.session_id || 'unknown'
            if (!sessions[sessionId]) {
                sessions[sessionId] = []
            }
            sessions[sessionId].push(activity)
        })

        return sessions
    }

    private getMostClickedElements(clicks: any[]): string[] {
        const elementCounts: Record<string, number> = {}

        clicks.forEach(click => {
            const element = click.element_id || click.metadata?.tag_name || 'unknown'
            elementCounts[element] = (elementCounts[element] || 0) + 1
        })

        return Object.entries(elementCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([element]) => element)
    }

    private getTimeRangeDate(timeRange: string): string {
        const now = new Date()
        switch (timeRange) {
            case '1d':
                return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
            case '7d':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
            case '30d':
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
            default:
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
    }

    private getDefaultMetrics(): EngagementMetrics {
        return {
            engagement_score: 0,
            bounce_rate: 0,
            conversion_rate: 0,
            avg_session_duration: 0,
            pages_per_session: 0,
            return_visitor_rate: 0
        }
    }
}

export const analyticsEngine = new AnalyticsEngine() 