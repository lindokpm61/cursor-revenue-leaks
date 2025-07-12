// Integration Services for CRM, Email, and Automation
import { CalculatorSubmission } from './database';

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
  async triggerN8nWorkflow(submission: CalculatorSubmission): Promise<{ success: boolean; error?: string }> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('n8n-trigger', {
        body: {
          submissionData: submission,
          metadata: {
            source: 'revenue-leak-calculator',
            version: '1.0',
            timestamp: new Date().toISOString()
          }
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
  async assignToEmailCampaign(submission: CalculatorSubmission): Promise<{ success: boolean; campaignId?: string; error?: string }> {
    try {
      const campaignId = this.selectEmailCampaign(submission.lead_score || 0);
      
      const prospectData = {
        email: submission.email,
        first_name: submission.company_name.split(' ')[0] || 'Unknown',
        last_name: submission.company_name.split(' ').slice(1).join(' ') || 'Contact',
        company_name: submission.company_name,
        custom_variables: {
          industry: submission.industry,
          current_arr: submission.current_arr.toLocaleString(),
          total_leakage: submission.calculations.totalLeakage.toLocaleString(),
          recovery_potential: submission.calculations.potentialRecovery70.toLocaleString(),
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
    submission: CalculatorSubmission, 
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

    // Only integrate with CRM for registered users
    if (scenario !== 'anonymous' && userId) {
      const crmResult = await this.integrateToCrm(userId, submission.id, scenario);
      if (crmResult.success) {
        results.crm = {
          companyId: crmResult.companyId,
          contactId: crmResult.contactId,
          opportunityId: crmResult.opportunityId
        };
        console.log('CRM integration completed successfully:', results.crm);
      } else {
        errors.push(`CRM integration failed: ${crmResult.error}`);
      }
    } else {
      console.log('Skipping CRM integration for anonymous scenario');
    }

    // 2. Trigger N8N workflow
    const n8nResult = await this.triggerN8nWorkflow(submission);
    if (n8nResult.success) {
      results.webhook = true;
    } else {
      errors.push(`N8N workflow failed: ${n8nResult.error}`);
    }

    // 3. Assign to email campaign (only for registered users)
    if (scenario !== 'anonymous') {
      const emailResult = await this.assignToEmailCampaign(submission);
      if (emailResult.success) {
        results.email = { campaignId: emailResult.campaignId };
      } else {
        errors.push(`Email campaign assignment failed: ${emailResult.error}`);
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors
    };
  }
}

export const integrations = new IntegrationService();