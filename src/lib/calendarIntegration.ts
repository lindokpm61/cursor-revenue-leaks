
import { conversionTracker } from './conversion-tracker';

interface BookingData {
  user_id?: string;
  temp_id?: string;
  email?: string;
  company_name?: string;
  recovery_potential?: number;
  lead_score?: number;
}

class CalendarIntegration {
  private readonly CAL_COM_USERNAME = 'rev-calculator';
  private readonly CAL_COM_EVENT_TYPE = 'revenuecalculator-strategy-session';
  
  /**
   * Generate dynamic Cal.com booking URL with pre-filled data
   */
  generateBookingUrl(bookingData: BookingData = {}): string {
    const baseUrl = `https://cal.com/${this.CAL_COM_USERNAME}/${this.CAL_COM_EVENT_TYPE}`;
    const params = new URLSearchParams();
    
    // Pre-fill form data if available
    if (bookingData.email) {
      params.append('email', bookingData.email);
    }
    
    if (bookingData.company_name) {
      params.append('name', bookingData.company_name);
    }
    
    // Add custom fields for internal tracking
    if (bookingData.temp_id) {
      params.append('temp_id', bookingData.temp_id);
    }
    
    if (bookingData.recovery_potential) {
      params.append('recovery_potential', bookingData.recovery_potential.toString());
    }
    
    if (bookingData.lead_score) {
      params.append('lead_score', bookingData.lead_score.toString());
    }
    
    // Add UTM parameters for tracking
    params.append('utm_source', 'revenue_calculator');
    params.append('utm_medium', 'web_app');
    params.append('utm_campaign', 'strategy_session');
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }
  
  /**
   * Track booking attempt and generate URL
   */
  async trackAndBook(bookingData: BookingData = {}): Promise<string> {
    // Track the booking attempt
    await conversionTracker.trackBookingAttempted(
      bookingData.user_id,
      bookingData.temp_id
    );
    
    // Generate and return the booking URL
    const bookingUrl = this.generateBookingUrl(bookingData);
    
    console.log('Booking attempt tracked:', {
      user_id: bookingData.user_id,
      temp_id: bookingData.temp_id,
      booking_url: bookingUrl
    });
    
    return bookingUrl;
  }
  
  /**
   * Open booking in new window/tab
   */
  async openBooking(bookingData: BookingData = {}): Promise<void> {
    const bookingUrl = await this.trackAndBook(bookingData);
    window.open(bookingUrl, '_blank', 'noopener,noreferrer');
  }
  
  /**
   * Navigate to booking in same window
   */
  async navigateToBooking(bookingData: BookingData = {}): Promise<void> {
    const bookingUrl = await this.trackAndBook(bookingData);
    window.location.href = bookingUrl;
  }
  
  /**
   * Check if Cal.com is available (basic connectivity check)
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`https://cal.com/${this.CAL_COM_USERNAME}`, {
        method: 'HEAD',
        mode: 'no-cors' // Avoid CORS issues for basic connectivity check
      });
      return true; // If we get here, the domain is reachable
    } catch (error) {
      console.warn('Cal.com availability check failed:', error);
      return false; // Assume available if check fails (network issues, etc.)
    }
  }
}

export const calendarIntegration = new CalendarIntegration();

// Export individual methods for convenience
export const {
  generateBookingUrl,
  trackAndBook,
  openBooking,
  navigateToBooking,
  checkAvailability
} = calendarIntegration;
