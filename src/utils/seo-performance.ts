// SEO Performance Monitor & Viral Growth Tracker
// Advanced analytics for search rankings and viral content

export interface SEOMetrics {
  // Core Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte

  // SEO Scores
  seoScore: number;
  accessibilityScore: number;
  performanceScore: number;
  bestPracticesScore: number;

  // Viral Metrics
  socialShares: {
    twitter: number;
    facebook: number;
    linkedin: number;
    whatsapp: number;
    total: number;
  };
  viralVelocity: number; // Shares per hour
  socialReach: number;
  engagementRate: number;

  // Search Rankings
  rankings: {
    'ai companion': number;
    'ai girlfriend': number;
    'virtual relationship': number;
    'emotional ai': number;
    'ai dating': number;
    'chatgpt alternative': number;
  };

  // Traffic Sources
  trafficSources: {
    organic: number;
    social: number;
    direct: number;
    referral: number;
    viral: number;
  };
}

export class SEOPerformanceMonitor {
  private metrics: SEOMetrics;
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.metrics = this.initializeMetrics();
    this.setupPerformanceMonitoring();
    this.setupViralTracking();
  }

  private initializeMetrics(): SEOMetrics {
    return {
      lcp: 0,
      fid: 0,
      cls: 0,
      fcp: 0,
      ttfb: 0,
      seoScore: 0,
      accessibilityScore: 0,
      performanceScore: 0,
      bestPracticesScore: 0,
      socialShares: {
        twitter: 0,
        facebook: 0,
        linkedin: 0,
        whatsapp: 0,
        total: 0
      },
      viralVelocity: 0,
      socialReach: 0,
      engagementRate: 0,
      rankings: {
        'ai companion': 0,
        'ai girlfriend': 0,
        'virtual relationship': 0,
        'emotional ai': 0,
        'ai dating': 0,
        'chatgpt alternative': 0
      },
      trafficSources: {
        organic: 0,
        social: 0,
        direct: 0,
        referral: 0,
        viral: 0
      }
    };
  }

  private setupPerformanceMonitoring() {
    // Monitor Core Web Vitals
    this.observeWebVitals();
    this.observeNavigationTiming();
    this.observeResourceTiming();
  }

  private observeWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
        this.reportMetric('lcp', this.metrics.lcp);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.fid = entry.processingStart - entry.startTime;
          this.reportMetric('fid', this.metrics.fid);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        let cls = 0;
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        });
        this.metrics.cls = cls;
        this.reportMetric('cls', this.metrics.cls);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    }
  }

  private observeNavigationTiming() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
        this.metrics.fcp = navigation.loadEventEnd - navigation.fetchStart;
        
        this.reportMetric('ttfb', this.metrics.ttfb);
        this.reportMetric('fcp', this.metrics.fcp);
      }
    }
  }

  private observeResourceTiming() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const resources = performance.getEntriesByType('resource');
      
      // Analyze critical resources
      const criticalResources = resources.filter(resource => 
        resource.name.includes('fonts.googleapis.com') ||
        resource.name.includes('thumbnail.png') ||
        resource.name.includes('main.js') ||
        resource.name.includes('main.css')
      );

      // Log slow resources for optimization
      criticalResources.forEach(resource => {
        if (resource.duration > 1000) { // More than 1 second
          console.warn(`Slow resource detected: ${resource.name} - ${resource.duration}ms`);
        }
      });
    }
  }

  private setupViralTracking() {
    // Track social sharing events
    this.trackSocialShares();
    this.trackViralGrowth();
    this.trackEngagement();
  }

  private trackSocialShares() {
    // Listen for social share events
    window.addEventListener('social-share', (event: any) => {
      const platform = event.detail.platform;
      const url = event.detail.url;

      if (this.metrics.socialShares[platform as keyof typeof this.metrics.socialShares] !== undefined) {
        (this.metrics.socialShares as any)[platform]++;
        this.metrics.socialShares.total++;
        
        this.calculateViralVelocity();
        this.reportViralMetric('share', platform, url);
      }
    });
  }

  private calculateViralVelocity() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    // Get shares from last hour (simplified calculation)
    const recentShares = this.getRecentShares(oneHourAgo);
    this.metrics.viralVelocity = recentShares;
  }

  private getRecentShares(since: number): number {
    // In a real implementation, this would query a database
    // For now, we'll use localStorage to track recent shares
    const recentSharesKey = 'loveai-recent-shares';
    const recentShares = JSON.parse(localStorage.getItem(recentSharesKey) || '[]');
    
    return recentShares.filter((share: any) => share.timestamp > since).length;
  }

  private trackViralGrowth() {
    // Monitor viral growth patterns
    setInterval(() => {
      this.analyzeViralTrends();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private analyzeViralTrends() {
    const currentVelocity = this.metrics.viralVelocity;
    const threshold = 50; // Shares per hour threshold for viral status
    
    if (currentVelocity > threshold) {
      this.triggerViralAlert(currentVelocity);
    }
    
    // Store viral data for trend analysis
    this.storeViralData({
      timestamp: Date.now(),
      velocity: currentVelocity,
      totalShares: this.metrics.socialShares.total,
      engagementRate: this.metrics.engagementRate
    });
  }

  private triggerViralAlert(velocity: number) {
    console.log(`🚀 VIRAL ALERT: ${velocity} shares per hour!`);
    
    // Trigger viral notifications
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'viral_threshold_reached', {
        custom_parameter_1: velocity,
        custom_parameter_2: 'shares_per_hour'
      });
    }

    // Could trigger notifications to team, scale infrastructure, etc.
    this.notifyViralStatus(velocity);
  }

  private notifyViralStatus(velocity: number) {
    // In production, this could send notifications to Slack, Discord, etc.
    const notification = {
      type: 'viral_alert',
      velocity,
      timestamp: new Date().toISOString(),
      message: `LoveAI is going viral! ${velocity} shares/hour`
    };
    
    console.log('Viral Notification:', notification);
  }

  private trackEngagement() {
    // Track user engagement for viral potential
    let startTime = Date.now();
    let interactions = 0;

    ['click', 'scroll', 'keydown', 'touchstart'].forEach(eventType => {
      window.addEventListener(eventType, () => {
        interactions++;
        this.updateEngagementRate(startTime, interactions);
      });
    });
  }

  private updateEngagementRate(startTime: number, interactions: number) {
    const timeOnSite = (Date.now() - startTime) / 1000; // seconds
    const engagementRate = timeOnSite > 0 ? (interactions / timeOnSite) * 100 : 0;
    
    this.metrics.engagementRate = Math.min(engagementRate, 100); // Cap at 100%
  }

  private storeViralData(data: any) {
    const viralDataKey = 'loveai-viral-data';
    const existingData = JSON.parse(localStorage.getItem(viralDataKey) || '[]');
    
    existingData.push(data);
    
    // Keep only last 24 hours of data
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const filteredData = existingData.filter((item: any) => item.timestamp > oneDayAgo);
    
    localStorage.setItem(viralDataKey, JSON.stringify(filteredData));
  }

  private reportMetric(name: string, value: number) {
    // Report to Google Analytics
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'web_vitals', {
        metric_name: name,
        metric_value: Math.round(value),
        metric_delta: value,
      });
    }

    // Report to console for debugging
    console.log(`SEO Metric - ${name}:`, value);
  }

  private reportViralMetric(action: string, platform: string, url: string) {
    // Report viral sharing to analytics
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'viral_share', {
        action,
        platform,
        url,
        total_shares: this.metrics.socialShares.total,
        viral_velocity: this.metrics.viralVelocity
      });
    }
  }

  // Public methods
  public getMetrics(): SEOMetrics {
    return { ...this.metrics };
  }

  public getViralScore(): number {
    // Calculate viral score based on multiple factors
    const shareScore = Math.min(this.metrics.socialShares.total / 1000 * 100, 100);
    const velocityScore = Math.min(this.metrics.viralVelocity / 100 * 100, 100);
    const engagementScore = this.metrics.engagementRate;
    
    return (shareScore + velocityScore + engagementScore) / 3;
  }

  public optimizeForViral(): string[] {
    const recommendations: string[] = [];
    
    // Performance recommendations
    if (this.metrics.lcp > 2500) {
      recommendations.push('Optimize LCP: Reduce image sizes and implement lazy loading');
    }
    
    if (this.metrics.fid > 100) {
      recommendations.push('Optimize FID: Reduce JavaScript execution time');
    }
    
    if (this.metrics.cls > 0.1) {
      recommendations.push('Optimize CLS: Set dimensions for images and ads');
    }

    // Viral recommendations
    if (this.metrics.socialShares.total < 100) {
      recommendations.push('Increase social sharing: Add more prominent share buttons');
    }
    
    if (this.metrics.viralVelocity < 10) {
      recommendations.push('Boost viral velocity: Create more shareable content');
    }
    
    if (this.metrics.engagementRate < 50) {
      recommendations.push('Improve engagement: Add interactive elements and better UX');
    }

    return recommendations;
  }

  public dispose() {
    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Initialize performance monitoring
export const seoMonitor = typeof window !== 'undefined' ? new SEOPerformanceMonitor() : null;

// Helper functions for viral optimization
export function trackViralShare(platform: string, url: string) {
  window.dispatchEvent(new CustomEvent('social-share', {
    detail: { platform, url }
  }));
}

export function getViralInsights() {
  if (!seoMonitor) return null;
  
  const metrics = seoMonitor.getMetrics();
  const viralScore = seoMonitor.getViralScore();
  const recommendations = seoMonitor.optimizeForViral();
  
  return {
    viralScore,
    totalShares: metrics.socialShares.total,
    viralVelocity: metrics.viralVelocity,
    engagementRate: metrics.engagementRate,
    recommendations,
    isViral: viralScore > 70,
    trendingPotential: metrics.viralVelocity > 25
  };
} 