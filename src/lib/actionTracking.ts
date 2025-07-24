// Action tracking service for CRM opportunity creation
import { crmIntegration, OpportunityData } from "./crmIntegration";

export class ActionTrackingService {
  
  /**
   * Track when a user downloads something (like action plan PDF)
   */
  static async trackDownload(userId: string, submissionId: string, downloadType: string, downloadData?: any) {
    try {
      console.log(`Tracking download: ${downloadType} for user ${userId}`);
      
      const opportunityData: OpportunityData = {
        userId,
        submissionId,
        actionType: 'download',
        actionData: {
          type: downloadType,
          ...downloadData,
          timestamp: new Date().toISOString()
        }
      };

      const result = await crmIntegration.createOpportunity(opportunityData);
      
      if (result.success) {
        console.log('Download opportunity created:', result.opportunityId);
      } else {
        console.error('Failed to create download opportunity:', result.error);
      }

      return result;
    } catch (error) {
      console.error('Error tracking download:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track when a user books a call or demo
   */
  static async trackBooking(userId: string, submissionId: string, bookingType: string, bookingData?: any) {
    try {
      console.log(`Tracking booking: ${bookingType} for user ${userId}`);
      
      const opportunityData: OpportunityData = {
        userId,
        submissionId,
        actionType: 'booking',
        actionData: {
          type: bookingType,
          ...bookingData,
          timestamp: new Date().toISOString()
        }
      };

      const result = await crmIntegration.createOpportunity(opportunityData);
      
      if (result.success) {
        console.log('Booking opportunity created:', result.opportunityId);
      } else {
        console.error('Failed to create booking opportunity:', result.error);
      }

      return result;
    } catch (error) {
      console.error('Error tracking booking:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track general user engagement
   */
  static async trackEngagement(userId: string, submissionId: string, engagementType: string, engagementData?: any) {
    try {
      console.log(`Tracking engagement: ${engagementType} for user ${userId}`);
      
      const opportunityData: OpportunityData = {
        userId,
        submissionId,
        actionType: 'engagement',
        actionData: {
          type: engagementType,
          ...engagementData,
          timestamp: new Date().toISOString()
        }
      };

      const result = await crmIntegration.createOpportunity(opportunityData);
      
      if (result.success) {
        console.log('Engagement opportunity created:', result.opportunityId);
      } else {
        console.error('Failed to create engagement opportunity:', result.error);
      }

      return result;
    } catch (error) {
      console.error('Error tracking engagement:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track when a user converts (signs up for service, makes purchase, etc.)
   */
  static async trackConversion(userId: string, submissionId: string, conversionType: string, conversionData?: any) {
    try {
      console.log(`Tracking conversion: ${conversionType} for user ${userId}`);
      
      const opportunityData: OpportunityData = {
        userId,
        submissionId,
        actionType: 'conversion',
        actionData: {
          type: conversionType,
          ...conversionData,
          timestamp: new Date().toISOString()
        }
      };

      const result = await crmIntegration.createOpportunity(opportunityData);
      
      if (result.success) {
        console.log('Conversion opportunity created:', result.opportunityId);
      } else {
        console.error('Failed to create conversion opportunity:', result.error);
      }

      return result;
    } catch (error) {
      console.error('Error tracking conversion:', error);
      return { success: false, error: error.message };
    }
  }
}

export const actionTracking = ActionTrackingService;