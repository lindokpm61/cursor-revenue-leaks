// CRM Integration Service for separated event handling
import { supabase } from "@/integrations/supabase/client";

export interface OpportunityData {
  userId: string;
  submissionId: string;
  actionType: 'download' | 'booking' | 'engagement' | 'conversion';
  actionData?: any;
}

export class CrmIntegrationService {
  
  /**
   * Create a CRM person for a user (called during registration)
   */
  static async createPerson(userId: string, email: string, firstName?: string, lastName?: string, phone?: string) {
    try {
      console.log('Creating CRM person for user:', userId);
      const { data, error } = await supabase.functions.invoke('create-crm-person', {
        body: {
          userId,
          email,
          firstName: firstName || email.split('@')[0] || 'Unknown',
          lastName: lastName || 'User',
          phone
        }
      });

      if (error) {
        console.error('Failed to create CRM person:', error);
        return { success: false, error: error.message };
      }

      return { success: true, personId: data?.personId };
    } catch (error) {
      console.error('Error creating CRM person:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a CRM company for a submission (called when calculator is completed)
   */
  static async createCompany(submissionId: string) {
    try {
      console.log('Creating CRM company for submission:', submissionId);
      const { data, error } = await supabase.functions.invoke('create-crm-company', {
        body: { submissionId }
      });

      if (error) {
        console.error('Failed to create CRM company:', error);
        return { success: false, error: error.message };
      }

      return { success: true, companyId: data?.companyId };
    } catch (error) {
      console.error('Error creating CRM company:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a CRM opportunity for user actions (downloads, bookings, etc.)
   */
  static async createOpportunity(opportunityData: OpportunityData) {
    try {
      console.log('Creating CRM opportunity:', opportunityData);
      const { data, error } = await supabase.functions.invoke('create-crm-opportunity', {
        body: opportunityData
      });

      if (error) {
        console.error('Failed to create CRM opportunity:', error);
        return { success: false, error: error.message };
      }

      return { success: true, opportunityId: data?.opportunityId };
    } catch (error) {
      console.error('Error creating CRM opportunity:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Trigger N8N workflow for person-company linking
   */
  static async triggerPersonCompanyLinking(personId: string, companyId: string, userId: string, submissionId: string) {
    try {
      console.log('Triggering N8N person-company linking workflow');
      const { data, error } = await supabase.functions.invoke('n8n-trigger', {
        body: {
          workflow_type: 'person-company-linking',
          data: {
            personId,
            companyId,
            userId,
            submissionId,
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) {
        console.error('Failed to trigger N8N workflow:', error);
        return { success: false, error: error.message };
      }

      return { success: true, executionId: data?.executionId };
    } catch (error) {
      console.error('Error triggering N8N workflow:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Complete CRM integration for a submission
   * This orchestrates the company creation and N8N workflow trigger
   */
  static async completeSubmissionIntegration(userId: string, submissionId: string) {
    try {
      console.log('Completing CRM integration for submission:', submissionId);
      
      // Step 1: Create company for the submission
      const companyResult = await this.createCompany(submissionId);
      if (!companyResult.success) {
        return companyResult;
      }

      // CRM persons table doesn't exist in current schema - skip this step
      // This functionality is now handled by edge functions
      console.log('CRM integration skipped - handled by edge functions');
      return { success: true, message: 'CRM integration deferred to edge functions' };

    } catch (error) {
      console.error('Error completing submission integration:', error);
      return { success: false, error: error.message };
    }
  }
}

export const crmIntegration = CrmIntegrationService;