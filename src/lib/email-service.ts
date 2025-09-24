// Email collection and marketing service
export interface EmailSubscription {
  email: string;
  source: 'landing' | 'newsletter' | 'waitlist' | 'beta';
  timestamp: Date;
  userAgent?: string;
  referrer?: string;
}

class EmailService {
  private apiEndpoint: string;

  constructor() {
    this.apiEndpoint = import.meta.env.DEV 
      ? '/api/email' 
      : '/.netlify/functions/email';
  }

  // Subscribe email to newsletter
  async subscribeEmail(email: string, source: string = 'landing'): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiEndpoint}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          source,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer
        })
      });

      if (!response.ok) {
        throw new Error('Failed to subscribe email');
      }

      return true;
    } catch (error) {
      console.error('Email subscription failed:', error);
      return false;
    }
  }

  // Validate email format
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Check if email is already subscribed (local storage check)
  isEmailSubscribed(email: string): boolean {
    const subscribedEmails = JSON.parse(localStorage.getItem('subscribedEmails') || '[]');
    return subscribedEmails.includes(email.toLowerCase());
  }

  // Mark email as subscribed locally
  markEmailSubscribed(email: string): void {
    const subscribedEmails = JSON.parse(localStorage.getItem('subscribedEmails') || '[]');
    if (!subscribedEmails.includes(email.toLowerCase())) {
      subscribedEmails.push(email.toLowerCase());
      localStorage.setItem('subscribedEmails', JSON.stringify(subscribedEmails));
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
