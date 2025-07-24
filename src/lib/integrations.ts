// Integration Services for CRM, Email, and Automation
import { Tables } from "@/integrations/supabase/types";

interface IntegrationConfig {
  twentyCrm: {
    url: string;
    apiKey: string;
  };
  n8nWebhook: {
    url: string;
    secret?: string;
  };
  smartlead: {
    apiUrl: string;
    apiKey: string;
  };
}

class IntegrationService {
  private config: IntegrationConfig;

  constructor() {
    // Note: Environment variables are handled via Supabase secrets in edge functions
    // Frontend calls edge functions which have access to secrets
    this.config = {
      twentyCrm: {
        url: '', // Will be handled by edge function
        apiKey: '' // Will be handled by edge function
      },
      n8nWebhook: {
        url: '', // Will be handled by edge function
        secret: ''
      },
      smartlead: {
        apiUrl: '', // Will be handled by edge function
        apiKey: ''
      }
    };
  }

  // New scenario-based CRM integration method
  async integrateToCrm(userId: string, submissionId: string, scenario: 'new_user' | 'existing_user' | 'anonymous'): Promise<{ success: boolean; companyId?: string; contactId?: string; opportunityId?: string; error?: string }> {
    try {
      console.log(`CRM integration for scenario: ${scenario}, user: ${userId}, submission: ${submissionId}`);
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('twenty-crm-integration', {
        body: {
          scenario,
          userId,
          submissionId
        }
      });

      if (error) {
        console.error('CRM integration error:', error);
        return { success: false, error: error.message };
      }

      if (data?.success) {
        return {
          success: true,
          companyId: data.companyId,
          contactId: data.contactId,
          opportunityId: data.opportunityId
        };
      } else {
        return { success: false, error: data?.error || 'Unknown CRM integration error' };
      }
    } catch (error) {
      console.error('CRM integration failed:', error);
      return { success: false, error: error.message };
    }
  }

  // N8N Webhook Integration - Now uses existing n8n-trigger edge function
  async triggerN8nWorkflow(submission: any): Promise<{ success: boolean; error?: string }> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('n8n-trigger', {
        body: {
          workflow_type: 'submission-completed',
          data: submission
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        return { success: true };
      } else {
        throw new Error(data?.error || 'N8N workflow trigger failed');
      }
    } catch (error) {
      console.error('N8N webhook error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Webhook trigger failed' 
      };
    }
  }

  // Smartlead Email Integration
  async assignToEmailCampaign(submission: any): Promise<{ success: boolean; campaignId?: string; error?: string }> {
    try {
      const campaignId = this.selectEmailCampaign(submission.lead_score || 0);
      
      const prospectData = {
        email: submission.email,
        first_name: submission.company_name.split(' ')[0] || 'Unknown',
        last_name: submission.company_name.split(' ').slice(1).join(' ') || 'Contact',
        company_name: submission.company_name,
        custom_variables: {
          industry: submission.industry || 'Unknown',
          current_arr: (submission.current_arr || 0).toLocaleString(),
          total_leakage: (submission.calculations?.totalLeakage || 0).toLocaleString(),
          recovery_potential: (submission.calculations?.potentialRecovery70 || 0).toLocaleString(),
          lead_score: submission.lead_score || 0
        }
      };

      const response = await fetch(`${this.config.smartlead.apiUrl}/campaigns/${campaignId}/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.config.smartlead.apiKey
        },
        body: JSON.stringify({ lead_list: [prospectData] })
      });

      if (!response.ok) {
        throw new Error(`Smartlead API error: ${response.statusText}`);
      }

      return { success: true, campaignId };
    } catch (error) {
      console.error('Email campaign assignment error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Email campaign assignment failed' 
      };
    }
  }

  // Helper methods
  private getOpportunityProbability(leadScore: number): number {
    if (leadScore >= 80) return 75;
    if (leadScore >= 60) return 50;
    if (leadScore >= 40) return 25;
    return 10;
  }

  private selectEmailCampaign(leadScore: number): string {
    // Return campaign IDs based on lead score
    if (leadScore >= 80) return 'enterprise-campaign-id';
    if (leadScore >= 60) return 'mid-market-campaign-id';
    if (leadScore >= 40) return 'smb-campaign-id';
    return 'nurture-campaign-id';
  }

  // Process submission with scenario-based approach
  async processSubmission(
    submission: any, 
    userId?: string, 
    scenario: 'new_user' | 'existing_user' | 'anonymous' = 'anonymous'
  ): Promise<{
    success: boolean;
    results: {
      crm?: { companyId?: string; contactId?: string; opportunityId?: string; };
      webhook?: boolean;
      email?: { campaignId?: string; };
    };
    errors: string[];
  }> {
    console.log(`Processing submission integrations for: ${submission.id}, scenario: ${scenario}`);
    
    const results: any = {};
    const errors: string[] = [];
    
    // Use Promise.allSettled to run integrations in parallel and don't fail if one fails
    const integrationPromises = [];

    // CRM Integration (only if user is authenticated)
    if (scenario !== 'anonymous' && userId) {
      integrationPromises.push(
        this.integrateToCrm(userId, submission.id, scenario)
          .then(result => ({ type: 'crm', result }))
          .catch(error => ({ type: 'crm', error: error.message }))
      );
    }

    // N8N Webhook Integration
    integrationPromises.push(
      this.triggerN8nWorkflow(submission)
        .then(result => ({ type: 'webhook', result }))
        .catch(error => ({ type: 'webhook', error: error.message }))
    );

    // Email Campaign Assignment (only for registered users)
    if (scenario !== 'anonymous') {
      integrationPromises.push(
        this.assignToEmailCampaign(submission)
          .then(result => ({ type: 'email', result }))
          .catch(error => ({ type: 'email', error: error.message }))
      );
    }

    // Wait for all integrations to complete (or fail)
    const integrationResults = await Promise.allSettled(integrationPromises);

    // Process results
    for (const promiseResult of integrationResults) {
      if (promiseResult.status === 'fulfilled') {
        const { type, result, error } = promiseResult.value;
        
        if (error) {
          errors.push(`${type.toUpperCase()} integration failed: ${error}`);
        } else if (result) {
          if (type === 'crm' && result.success) {
            results.crm = {
              companyId: result.companyId,
              contactId: result.contactId,
              opportunityId: result.opportunityId
            };
            console.log('CRM integration completed successfully:', results.crm);
          } else if (type === 'webhook' && result.success) {
            results.webhook = true;
          } else if (type === 'email' && result.success) {
            results.email = { campaignId: result.campaignId };
          } else {
            errors.push(`${type.toUpperCase()} integration failed: ${result.error || 'Unknown error'}`);
          }
        }
      } else {
        errors.push(`Integration promise rejected: ${promiseResult.reason}`);
      }
    }

    // Return success=true even if some integrations failed (non-blocking)
    // This ensures submission saving isn't blocked by integration failures
    return {
      success: true,
      results,
      errors
    };
  }
}

export const integrations = new IntegrationService();