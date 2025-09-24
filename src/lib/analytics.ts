// Analytics and monitoring service
export interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  userId?: string;
  timestamp: Date;
}

export interface UserBehavior {
  pageViews: number;
  sessionDuration: number;
  events: AnalyticsEvent[];
  conversions: number;
  lastActivity: Date;
}

class AnalyticsService {
  private isInitialized = false;
  private events: AnalyticsEvent[] = [];
  private sessionStart: Date = new Date();
  private userId?: string;

  constructor() {
    this.initializeGoogleAnalytics();
  }

  private initializeGoogleAnalytics() {
    // Check if Google Analytics is available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      this.isInitialized = true;
      console.log('📊 Google Analytics initialized');
    } else {
      console.warn('📊 Google Analytics not available');
    }
  }

  // Track page view
  trackPageView(pageName: string, pagePath?: string) {
    const event: AnalyticsEvent = {
      event: 'page_view',
      category: 'Navigation',
      action: 'Page View',
      label: pageName,
      timestamp: new Date()
    };

    this.trackEvent(event);

    if (this.isInitialized && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_title: pageName,
        page_location: pagePath || window.location.href
      });
    }
  }

  // Track custom event
  trackEvent(event: AnalyticsEvent) {
    this.events.push(event);
    
    // Store in localStorage for persistence
    this.saveEventsToStorage();

    if (this.isInitialized && (window as any).gtag) {
      (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value
      });
    }

    console.log('📊 Event tracked:', event);
  }

  // Track user action
  trackUserAction(action: string, category: string, label?: string, value?: number) {
    this.trackEvent({
      event: 'user_action',
      category,
      action,
      label,
      value,
      userId: this.userId,
      timestamp: new Date()
    });
  }

  // Track conversion
  trackConversion(conversionType: string, value?: number) {
    this.trackEvent({
      event: 'conversion',
      category: 'Conversion',
      action: conversionType,
      value,
      userId: this.userId,
      timestamp: new Date()
    });

    if (this.isInitialized && (window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL',
        value: value,
        currency: 'USD'
      });
    }
  }

  // Track AI interaction
  trackAIInteraction(interactionType: 'chat_start' | 'chat_message' | 'voice_call' | 'character_create', characterId?: string) {
    this.trackUserAction(
      interactionType,
      'AI Interaction',
      characterId,
      undefined
    );
  }

  // Track subscription
  trackSubscription(planId: string, value: number) {
    this.trackConversion('subscription', value);
    this.trackUserAction('subscription', 'Monetization', planId, value);
  }

  // Set user ID
  setUserId(userId: string) {
    this.userId = userId;
    
    if (this.isInitialized && (window as any).gtag) {
      (window as any).gtag('config', 'G-ZYJ4G8FVWM', {
        user_id: userId
      });
    }
  }

  // Get user behavior data
  getUserBehavior(): UserBehavior {
    const now = new Date();
    const sessionDuration = now.getTime() - this.sessionStart.getTime();

    return {
      pageViews: this.events.filter(e => e.event === 'page_view').length,
      sessionDuration: Math.round(sessionDuration / 1000), // in seconds
      events: this.events,
      conversions: this.events.filter(e => e.event === 'conversion').length,
      lastActivity: now
    };
  }

  // Save events to localStorage
  private saveEventsToStorage() {
    try {
      localStorage.setItem('analytics_events', JSON.stringify(this.events));
    } catch (error) {
      console.warn('Failed to save analytics events:', error);
    }
  }

  // Load events from localStorage
  loadEventsFromStorage() {
    try {
      const stored = localStorage.getItem('analytics_events');
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load analytics events:', error);
    }
  }

  // Get analytics summary
  getAnalyticsSummary() {
    const behavior = this.getUserBehavior();
    const eventCounts = this.events.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents: this.events.length,
      pageViews: behavior.pageViews,
      sessionDuration: behavior.sessionDuration,
      conversions: behavior.conversions,
      eventBreakdown: eventCounts,
      lastActivity: behavior.lastActivity
    };
  }

  // Track error
  trackError(error: Error, context?: string) {
    this.trackEvent({
      event: 'error',
      category: 'Error',
      action: 'Error Occurred',
      label: `${error.name}: ${error.message}`,
      userId: this.userId,
      timestamp: new Date()
    });

    console.error('📊 Error tracked:', error, context);
  }

  // Track performance
  trackPerformance(metric: string, value: number, unit: string = 'ms') {
    this.trackEvent({
      event: 'performance',
      category: 'Performance',
      action: metric,
      label: unit,
      value: Math.round(value),
      userId: this.userId,
      timestamp: new Date()
    });
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Initialize analytics on page load
if (typeof window !== 'undefined') {
  analytics.loadEventsFromStorage();
  analytics.trackPageView('Landing Page', window.location.pathname);
}
