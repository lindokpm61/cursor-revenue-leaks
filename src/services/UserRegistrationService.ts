import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  actualCompanyName?: string;
  actualRole?: string;
  businessModel?: string;
  userClassification?: string;
  userTier?: string;
  tempId?: string;
}

interface RegistrationResult {
  success: boolean;
  user?: User;
  error?: string;
}

export class UserRegistrationService {
  /**
   * Core registration function - handles all registration logic atomically
   */
  static async register(data: RegistrationData): Promise<RegistrationResult> {
    try {
      console.log('🚀 Starting user registration for:', data.email);
      
      // Step 1: Create Supabase auth user
      const authResult = await this.createAuthUser(data);
      if (!authResult.success || !authResult.user) {
        return { success: false, error: authResult.error };
      }

      // Step 2: Create user profile (core requirement)
      const profileResult = await this.createUserProfile(authResult.user, data);
      if (!profileResult.success) {
        console.error('Profile creation failed but auth succeeded - user can still login');
        // Don't fail registration if profile creation fails
      }

      // Step 3: Background tasks (non-blocking)
      this.processBackgroundTasks(authResult.user, data);

      console.log('✅ User registration completed successfully');
      return { 
        success: true, 
        user: authResult.user 
      };

    } catch (error) {
      console.error('❌ Registration failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      };
    }
  }

  /**
   * Creates the core auth user
   */
  private static async createAuthUser(data: RegistrationData) {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            company_name: data.actualCompanyName,
            role: data.actualRole
          }
        }
      });

      if (error) {
        console.error('Auth creation failed:', error);
        return { success: false, error: error.message };
      }

      if (!authData.user) {
        return { success: false, error: 'User creation failed' };
      }

      console.log('✅ Auth user created:', authData.user.id);
      return { success: true, user: authData.user };

    } catch (error) {
      console.error('Auth creation error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Auth creation failed' 
      };
    }
  }

  /**
   * Creates user profile with safe data handling
   */
  private static async createUserProfile(user: User, data: RegistrationData) {
    try {
      // Get temp submission data if available
      let tempSubmission = null;
      if (data.tempId) {
        const { data: temp } = await supabase
          .from('temporary_submissions')
          .select('*')
          .eq('temp_id', data.tempId)
          .maybeSingle();
        tempSubmission = temp;
      }

      const profileData = {
        id: user.id,
        company_name: data.actualCompanyName || tempSubmission?.company_name || null,
        actual_company_name: data.actualCompanyName || null,
        role: data.actualRole || 'user',
        actual_role: data.actualRole || null,
        phone: data.phone || null,
        business_model: data.businessModel || 'internal',
        user_classification: data.userClassification || 'standard',
        user_tier: data.userTier || 'standard',
        engagement_tier: 'standard',
        first_submission_date: tempSubmission?.created_at || null,
        total_companies_analyzed: tempSubmission ? 1 : 0,
        engagement_score: 0,
        utm_source: tempSubmission?.utm_source || null,
        utm_medium: tempSubmission?.utm_medium || null,
        utm_campaign: tempSubmission?.utm_campaign || null
      };

      console.log('Creating user profile with data:', profileData);

      const { error } = await supabase
        .from('user_profiles')
        .upsert(profileData);

      if (error) {
        console.error('Profile creation failed:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ User profile created successfully');
      return { success: true };

    } catch (error) {
      console.error('Profile creation error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Profile creation failed' 
      };
    }
  }

  /**
   * Handles all background tasks asynchronously (non-blocking)
   */
  private static async processBackgroundTasks(user: User, data: RegistrationData) {
    // Run all background tasks without awaiting to prevent blocking
    Promise.allSettled([
      this.migrateTempSubmissionData(user, data.tempId),
      this.createCrmPerson(user, data),
      this.triggerWorkflows(user, data),
      this.cancelAbandonmentEmails(data.tempId)
    ]).then((results) => {
      results.forEach((result, index) => {
        const taskNames = ['migration', 'crm', 'workflows', 'email-cleanup'];
        if (result.status === 'rejected') {
          console.warn(`Background task ${taskNames[index]} failed:`, result.reason);
        }
      });
    });
  }

  /**
   * Migrates temporary submission data to permanent submission
   */
  private static async migrateTempSubmissionData(user: User, tempId?: string) {
    if (!tempId) return;

    try {
      const { data: tempSubmission } = await supabase
        .from('temporary_submissions')
        .select('*')
        .eq('temp_id', tempId)
        .maybeSingle();

      if (!tempSubmission) return;

      const calculatorData = (tempSubmission.calculator_data as any) || {};
      
      const submissionData = {
        user_id: user.id,
        company_name: tempSubmission.company_name || 'Unknown Company',
        contact_email: tempSubmission.email || user.email,
        phone: tempSubmission.phone,
        industry: tempSubmission.industry,
        current_arr: calculatorData.step_1?.currentARR || 0,
        monthly_leads: calculatorData.step_2?.monthlyLeads || 0,
        average_deal_value: calculatorData.step_2?.averageDealValue || 0,
        lead_response_time: calculatorData.step_2?.leadResponseTimeHours || 0,
        monthly_free_signups: calculatorData.step_3?.monthlyFreeSignups || 0,
        free_to_paid_conversion: calculatorData.step_3?.freeToPaidConversionRate || 0,
        monthly_mrr: calculatorData.step_3?.monthlyMRR || 0,
        failed_payment_rate: calculatorData.step_4?.failedPaymentRate || 0,
        manual_hours: calculatorData.step_4?.manualHoursPerWeek || 0,
        hourly_rate: calculatorData.step_4?.hourlyRate || 0,
        total_leak: tempSubmission.total_revenue_leak,
        recovery_potential_70: tempSubmission.recovery_potential,
        lead_score: tempSubmission.lead_score,
        utm_source: tempSubmission.utm_source,
        utm_medium: tempSubmission.utm_medium,
        utm_campaign: tempSubmission.utm_campaign
      };

      const { error } = await supabase
        .from('submissions')
        .insert(submissionData);

      if (error) throw error;

      // Mark temp submission as converted
      await supabase
        .from('temporary_submissions')
        .update({
          converted_to_user_id: user.id,
          conversion_completed_at: new Date().toISOString()
        })
        .eq('temp_id', tempId);

      console.log('✅ Submission data migrated successfully');

    } catch (error) {
      console.error('❌ Submission migration failed:', error);
    }
  }

  /**
   * Creates CRM person (non-blocking)
   */
  private static async createCrmPerson(user: User, data: RegistrationData) {
    try {
      await supabase.functions.invoke('create-crm-person', {
        body: {
          userId: user.id,
          email: user.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone
        }
      });
      console.log('✅ CRM person creation triggered');
    } catch (error) {
      console.warn('⚠️ CRM person creation failed (non-blocking):', error);
    }
  }

  /**
   * Triggers N8N workflows (non-blocking)
   */
  private static async triggerWorkflows(user: User, data: RegistrationData) {
    try {
      // Only trigger if we have N8N integration set up
      const workflowPromises = [];

      // Registration completion workflow
      workflowPromises.push(
        supabase.functions.invoke('n8n-trigger', {
          body: {
            workflow: 'registration-completed',
            data: {
              user_id: user.id,
              email: user.email,
              company: data.actualCompanyName,
              registration_date: new Date().toISOString()
            }
          }
        })
      );

      await Promise.allSettled(workflowPromises);
      console.log('✅ Workflows triggered');
    } catch (error) {
      console.warn('⚠️ Workflow triggers failed (non-blocking):', error);
    }
  }

  /**
   * Cancels any pending abandonment emails (non-blocking)
   */
  private static async cancelAbandonmentEmails(tempId?: string) {
    if (!tempId) return;

    try {
      await supabase
        .from('email_sequence_queue')
        .update({ 
          status: 'cancelled',
          sent_at: new Date().toISOString()
        })
        .eq('temp_id', tempId)
        .eq('status', 'pending')
        .like('sequence_type', 'abandoned%');

      console.log('✅ Abandonment emails cancelled');
    } catch (error) {
      console.warn('⚠️ Email cancellation failed (non-blocking):', error);
    }
  }
}