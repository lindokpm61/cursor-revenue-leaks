import { enhancedIntegrationLogger } from './enhanced-integration-logger';

interface TrackingData {
  event_type: string;
  event_data?: any;
  user_id?: string;
  temp_id?: string;
  session_id?: string;
}

class ConversionTracker {
  private sessionId: string;
  
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.initializeGoogleAnalytics();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('conversion_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('conversion_session_id', sessionId);
    }
    return sessionId;
  }

  private initializeGoogleAnalytics(): void {
    // Initialize GA4 if not already present
    if (typeof window !== 'undefined' && !window.gtag) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID';
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer.push(args);
      }
      window.gtag = gtag;
      
      gtag('js', new Date());
      gtag('config', 'GA_MEASUREMENT_ID', {
        page_title: document.title,
        page_location: window.location.href
      });
    }
  }

  async trackEvent(data: TrackingData): Promise<void> {
    const eventData = {
      session_id: this.sessionId,
      event_type: data.event_type,
      event_data: data.event_data || {},
      user_id: data.user_id,
      temp_id: data.temp_id,
      page_url: window.location.href,
      referrer_url: document.referrer,
      utm_source: this.getURLParameter('utm_source'),
      utm_medium: this.getURLParameter('utm_medium'),
      utm_campaign: this.getURLParameter('utm_campaign'),
      user_agent: navigator.userAgent
    };

    // Log to database
    await enhancedIntegrationLogger.logConversionEvent(eventData);
    
    // Send to Google Analytics
    if (window.gtag) {
      window.gtag('event', data.event_type, {
        event_category: 'Calculator',
        event_label: data.event_data?.step || 'unknown',
        value: data.event_data?.value || 0,
        custom_parameter_1: data.temp_id,
        custom_parameter_2: data.user_id
      });
    }
  }

  async trackCalculatorStart(temp_id: string): Promise<void> {
    await this.trackEvent({
      event_type: 'calculator_start',
      temp_id,
      event_data: { timestamp: Date.now() }
    });
  }

  async trackStepCompleted(temp_id: string, step: number, stepData: any): Promise<void> {
    await this.trackEvent({
      event_type: 'step_completed',
      temp_id,
      event_data: { step, ...stepData }
    });
  }

  async trackEmailCaptured(temp_id: string, email: string): Promise<void> {
    await this.trackEvent({
      event_type: 'email_captured',
      temp_id,
      event_data: { email, timestamp: Date.now() }
    });
  }

  async trackRegistration(user_id: string, temp_id?: string): Promise<void> {
    await this.trackEvent({
      event_type: 'registration',
      user_id,
      temp_id,
      event_data: { timestamp: Date.now() }
    });
  }

  async trackPDFDownload(user_id?: string, temp_id?: string): Promise<void> {
    await this.trackEvent({
      event_type: 'pdf_download',
      user_id,
      temp_id,
      event_data: { timestamp: Date.now() }
    });
  }

  async trackBookingAttempted(user_id?: string, temp_id?: string): Promise<void> {
    await this.trackEvent({
      event_type: 'booking_attempted',
      user_id,
      temp_id,
      event_data: { timestamp: Date.now() }
    });
  }

  private getURLParameter(name: string): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }
}

// Global conversion tracker instance
export const conversionTracker = new ConversionTracker();

// Global types for window object
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}