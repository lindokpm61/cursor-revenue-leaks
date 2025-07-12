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

  // CRM Integration - Create Company first, then Contact, then Opportunity
  async createCrmCompany(submission: CalculatorSubmission): Promise<{ success: boolean; companyId?: string; error?: string }> {
    try {
      console.log('Creating CRM company for submission:', submission.id);
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('twenty-crm-integration', {
        body: {
          action: 'create_company',
          companyData: {
            name: submission.company_name,
            currentArr: submission.current_arr,
            monthlyMrr: submission.monthly_mrr,
            totalLeak: submission.calculations?.totalLeakage || 0,
            recoveryPotential70: submission.calculations?.potentialRecovery70 || 0,
            leadScore: submission.lead_score || 0,
            leadCategory: submission.lead_score > 80 ? "ENTERPRISE" : submission.lead_score > 60 ? "PREMIUM" : "STANDARD",
            monthlyLeads: submission.monthly_leads,
            industry: submission.industry
          },
          submissionId: submission.id
        }
      });

      if (error) {
        console.error('CRM company creation error:', error);
        return { success: false, error: error.message };
      }

      if (data?.success) {
        return { success: true, companyId: data.companyId };
      } else {
        return { success: false, error: data?.error || 'Unknown CRM company error' };
      }
    } catch (error) {
      console.error('CRM company creation failed:', error);
      return { success: false, error: error.message };
    }
  }

  async createCrmContact(submission: CalculatorSubmission, companyId?: string): Promise<{ success: boolean; contactId?: string; error?: string }> {
    try {
      console.log('Creating CRM contact for submission:', submission.id, 'with company:', companyId);
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('twenty-crm-integration', {
        body: {
          action: 'create_contact',
          contactData: {
            email: submission.email,
            firstName: submission.company_name.split(' ')[0],
            lastName: submission.company_name.split(' ').slice(1).join(' ') || 'Contact',
            company: submission.company_name,
            phone: undefined, // Phone not available in CalculatorSubmission interface
            companyId: companyId, // Link to company
            industry: submission.industry,
            leadScore: submission.lead_score || 0
          },
          submissionId: submission.id
        }
      });

      if (error) {
        console.error('CRM contact creation error:', error);
        return { success: false, error: error.message };
      }

      if (data?.success) {
        return { success: true, contactId: data.contactId };
      } else {
        return { success: false, error: data?.error || 'Unknown CRM contact error' };
      }
    } catch (error) {
      console.error('CRM contact creation failed:', error);
      return { success: false, error: error.message };
    }
  }

  async createCrmOpportunity(contactId: string, companyId: string, submission: CalculatorSubmission): Promise<{ success: boolean; opportunityId?: string; error?: string }> {
    try {
      console.log('Creating CRM opportunity for contact:', contactId, 'and company:', companyId);
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('twenty-crm-integration', {
        body: {
          action: 'create_opportunity',
          opportunityData: {
            name: `${submission.company_name} - Revenue Recovery`,
            contactId: contactId,
            companyId: companyId, // Required for proper linking
            companyName: submission.company_name,
            recoveryPotential: submission.calculations?.potentialRecovery70 || 0,
            totalRevenueLeak: submission.calculations?.totalLeakage || 0,
            annualRecurringRevenue: submission.current_arr,
            leadScore: submission.lead_score || 0,
            leadCategory: submission.lead_score > 80 ? "ENTERPRISE" : submission.lead_score > 60 ? "PREMIUM" : "STANDARD",
            leadSource: "CALCULATOR"
          },
          submissionId: submission.id
        }
      });

      if (error) {
        console.error('CRM opportunity creation error:', error);
        return { success: false, error: error.message };
      }

      if (data?.success) {
        return { success: true, opportunityId: data.opportunityId };
      } else {
        return { success: false, error: data?.error || 'Unknown opportunity error' };
      }
    } catch (error) {
      console.error('CRM opportunity creation failed:', error);
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

  // Process complete submission workflow - Proper Company → Contact → Opportunity workflow
  async processSubmission(submission: CalculatorSubmission): Promise<{
    success: boolean;
    results: {
      crm?: { companyId?: string; contactId?: string; opportunityId?: string; };
      webhook?: boolean;
      email?: { campaignId?: string; };
    };
    errors: string[];
  }> {
    console.log('Processing submission integrations for:', submission.id);
    
    const results: any = {};
    const errors: string[] = [];

    // Step 1: Create or find CRM company
    const companyResult = await this.createCrmCompany(submission);
    if (companyResult.success && companyResult.companyId) {
      results.crm = { companyId: companyResult.companyId };
      
      // Step 2: Create or find CRM contact linked to company
      const contactResult = await this.createCrmContact(submission, companyResult.companyId);
      if (contactResult.success && contactResult.contactId) {
        results.crm.contactId = contactResult.contactId;
        
        // Step 3: Create opportunity linked to both company and contact
        const oppResult = await this.createCrmOpportunity(contactResult.contactId, companyResult.companyId, submission);
        if (oppResult.success) {
          results.crm.opportunityId = oppResult.opportunityId;
          console.log('Full CRM integration completed successfully:', results.crm);
        } else {
          errors.push(`Opportunity creation failed: ${oppResult.error}`);
        }
      } else {
        errors.push(`CRM contact creation failed: ${contactResult.error}`);
      }
    } else {
      errors.push(`CRM company creation failed: ${companyResult.error}`);
    }

    // 2. Trigger N8N workflow
    const n8nResult = await this.triggerN8nWorkflow(submission);
    if (n8nResult.success) {
      results.webhook = true;
    } else {
      errors.push(`N8N workflow failed: ${n8nResult.error}`);
    }

    // 3. Assign to email campaign
    const emailResult = await this.assignToEmailCampaign(submission);
    if (emailResult.success) {
      results.email = { campaignId: emailResult.campaignId };
    } else {
      errors.push(`Email campaign assignment failed: ${emailResult.error}`);
    }

    return {
      success: errors.length === 0,
      results,
      errors
    };
  }
}

export const integrations = new IntegrationService();