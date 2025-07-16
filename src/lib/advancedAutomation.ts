import { supabase } from "@/integrations/supabase/client";
import { 
  getTemporarySubmission, 
  saveTemporarySubmission 
} from "@/lib/submission";
import { 
  triggerEmailSequence, 
  triggerN8NWorkflow 
} from "./coreDataCapture";
import { integrations } from "./integrations";
import { CalculatorSubmission } from "./database";

// Get scheduled email sequences that are ready to be sent
export const getScheduledEmailSequences = async () => {
  try {
    const { data, error } = await supabase
      .from('email_sequence_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting scheduled email sequences:', error);
    return [];
  }
};

// Check if abandonment email should be cancelled based on user progress
export const shouldCancelAbandonmentEmail = (scheduledEmail: any, currentProgress: any): boolean => {
  if (!currentProgress) return false;
  
  // Cancel if user has progressed beyond the abandonment trigger point
  const emailStepMatch = scheduledEmail.sequence_type.match(/abandoned_step_(\d+)/);
  if (emailStepMatch) {
    const abandonedStep = parseInt(emailStepMatch[1]);
    return currentProgress.current_step > abandonedStep;
  }
  
  // Cancel if user completed calculator after scheduling abandonment email
  if (scheduledEmail.sequence_type === 'abandoned_results') {
    return currentProgress.steps_completed >= 4;
  }
  
  // Cancel if user registered after scheduling
  if (currentProgress.converted_to_user_id) {
    return true;
  }
  
  return false;
};

// Cancel a scheduled email
export const cancelScheduledEmail = async (emailId: string) => {
  try {
    const { error } = await supabase
      .from('email_sequence_queue')
      .update({ 
        status: 'cancelled',
        sent_at: new Date().toISOString()
      })
      .eq('id', emailId);

    if (error) throw error;
  } catch (error) {
    console.error('Error cancelling scheduled email:', error);
  }
};

// Mark email as sent
export const markEmailAsSent = async (emailId: string) => {
  try {
    const { error } = await supabase
      .from('email_sequence_queue')
      .update({ 
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', emailId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking email as sent:', error);
  }
};

// Abandonment detection and recovery system
export const setupAbandonmentRecovery = async () => {
  try {
    // Process scheduled email sequences
    const scheduledEmails = await getScheduledEmailSequences();
    
    for (const scheduledEmail of scheduledEmails) {
      // Check if user has progressed since scheduling
      const currentProgress = await getTemporarySubmission(scheduledEmail.temp_id);
      
      if (shouldCancelAbandonmentEmail(scheduledEmail, currentProgress)) {
        await cancelScheduledEmail(scheduledEmail.id);
        continue;
      }
      
      // Trigger the scheduled email through N8N
      const contactData = scheduledEmail.contact_data as Record<string, any> || {};
      await triggerEmailSequence(scheduledEmail.sequence_type, {
        ...contactData,
        scheduled_email_id: scheduledEmail.id
      });
      
      // Mark as sent
      await markEmailAsSent(scheduledEmail.id);
    }
  } catch (error) {
    console.error('Error in abandonment recovery setup:', error);
  }
};

// Get submissions by email domain for consultant detection
export const getSubmissionsByEmailDomain = async (emailDomain: string) => {
  try {
    const { data, error } = await supabase
      .from('temporary_submissions')
      .select('*')
      .like('email', `%@${emailDomain}`)
      .not('email', 'is', null);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting submissions by email domain:', error);
    return [];
  }
};

// Update temporary submission with new data
export const updateTemporarySubmission = async (tempId: string, updates: any) => {
  try {
    await saveTemporarySubmission({
      temp_id: tempId,
      ...updates,
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating temporary submission:', error);
    throw error;
  }
};

// Consultant detection and special handling
export const detectAndHandleConsultants = async (tempId: string) => {
  try {
    const submission = await getTemporarySubmission(tempId);
    if (!submission?.email) return;
    
    // Check for multiple companies from same email domain
    const emailDomain = submission.email.split('@')[1];
    const otherSubmissions = await getSubmissionsByEmailDomain(emailDomain);
    
    if (otherSubmissions.length > 1) {
      // Consultant detected
      await triggerEmailSequence('consultant_detected', {
        email: submission.email,
        company: submission.company_name,
        temp_id: tempId,
        companies_analyzed: otherSubmissions.length,
        other_companies: otherSubmissions.map(s => s.company_name).filter(Boolean)
      });
      
      // Flag for special sales handling
      await updateTemporarySubmission(tempId, {
        user_classification: 'consultant',
        special_handling: true,
        consultant_data: {
          companies_analyzed: otherSubmissions.length,
          detection_date: new Date().toISOString(),
          email_domain: emailDomain
        }
      });
      
      // Trigger high-priority N8N workflow for consultant handling
      await triggerN8NWorkflow('consultant-special-handling', {
        temp_id: tempId,
        email: submission.email,
        companies_count: otherSubmissions.length,
        total_potential: otherSubmissions.reduce((sum, s) => sum + (s.recovery_potential || 0), 0)
      });
    }
  } catch (error) {
    console.error('Error in consultant detection:', error);
  }
};

// Determine user classification based on registration and submission data
export const determineUserClassification = (registrationData: any, tempSubmission: any): string => {
  // Check if consultant was already detected
  if (tempSubmission.user_classification === 'consultant') {
    return 'consultant';
  }
  
  // Check registration indicators
  if (registrationData.businessModel === 'consulting' || 
      registrationData.actualRole?.toLowerCase().includes('consultant')) {
    return 'consultant';
  }
  
  // Check for enterprise indicators
  if (tempSubmission.calculator_data?.step_1?.currentARR > 50000000) {
    return 'enterprise';
  }
  
  // Check for investor/PE indicators
  if (registrationData.actualRole?.toLowerCase().includes('investor') ||
      registrationData.actualRole?.toLowerCase().includes('private equity')) {
    return 'investor';
  }
  
  return 'standard';
};

// Calculate initial engagement score for new users
export const calculateInitialEngagementScore = (tempSubmission: any): number => {
  let score = 0;
  
  // Base completion score
  score += (tempSubmission.steps_completed || 0) * 10;
  
  // Time engagement bonus
  const timeSpent = tempSubmission.time_spent_seconds || 0;
  if (timeSpent > 300) score += 15; // 5+ minutes
  else if (timeSpent > 120) score += 10; // 2+ minutes
  else if (timeSpent > 60) score += 5; // 1+ minute
  
  // Interaction bonus
  score += Math.min((tempSubmission.calculator_interactions || 0) * 2, 20);
  
  // Email sequences engagement
  const emailSequences = tempSubmission.email_sequences_triggered || [];
  score += emailSequences.length * 5;
  
  // Data quality bonus (more complete data = higher engagement)
  const calculatorData = tempSubmission.calculator_data || {};
  const stepCompleteness = Object.keys(calculatorData).length;
  score += stepCompleteness * 5;
  
  return Math.min(score, 100);
};

// Create user account through Supabase Auth
export const createUserAccount = async (registrationData: any) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: registrationData.email,
      password: registrationData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          role: registrationData.role || 'user',
          company_name: registrationData.actualCompany,
          actual_role: registrationData.actualRole,
          business_model: registrationData.businessModel,
          first_name: registrationData.firstName,
          last_name: registrationData.lastName,
          phone: registrationData.phone
        }
      }
    });

    if (error) {
      // Check if user already exists, try to sign them in instead
      if (error.message?.includes('already registered')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: registrationData.email,
          password: registrationData.password,
        });
        
        if (signInError) {
          throw new Error('An account with this email already exists. Please sign in instead or use a different email address.');
        }
        
        return signInData.user;
      }
      throw new Error(error.message || 'Registration failed. Please try again.');
    }
    
    if (!data.user) throw new Error('User creation failed');

    return data.user;
  } catch (error) {
    console.error('Error creating user account:', error);
    throw error;
  }
};

// Create permanent submission record
export const createSubmission = async (submissionData: any) => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .insert([submissionData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating submission:', error);
    throw error;
  }
};

// Create enhanced user profile
export const createUserProfile = async (profileData: any) => {
  try {
    // Remove any UTM fields that don't exist in the table
    const cleanProfileData = {
      id: profileData.user_id,
      company_name: profileData.actual_company_name,
      actual_company_name: profileData.actual_company_name,
      role: profileData.actual_role,
      actual_role: profileData.actual_role,
      phone: profileData.phone,
      user_classification: profileData.user_classification,
      business_model: profileData.business_model,
      first_submission_date: profileData.first_submission_date,
      total_companies_analyzed: profileData.total_companies_analyzed,
      engagement_score: profileData.engagement_score
    };

    console.log('Creating user profile with cleaned data:', cleanProfileData);

    const { data, error } = await supabase
      .from('user_profiles')
      .insert(cleanProfileData);

    if (error) {
      console.error('Supabase error creating user profile:', error);
      throw error;
    }
    
    console.log('User profile created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Cancel pending abandonment emails for a specific temp_id
export const cancelPendingAbandonmentEmails = async (tempId: string) => {
  try {
    const { error } = await supabase
      .from('email_sequence_queue')
      .update({ 
        status: 'cancelled',
        sent_at: new Date().toISOString()
      })
      .eq('temp_id', tempId)
      .eq('status', 'pending')
      .like('sequence_type', 'abandoned%');

    if (error) throw error;
  } catch (error) {
    console.error('Error cancelling pending abandonment emails:', error);
  }
};

// User registration integration with data migration
export const handleUserRegistration = async (registrationData: any, tempId: string) => {
  try {
    // 1. Create user account
    const user = await createUserAccount(registrationData);
    
    // 2. Get temporary submission data
    const tempSubmission = await getTemporarySubmission(tempId);
    
    if (tempSubmission) {
      // 3. Create permanent submission record
      const calculatorData = tempSubmission.calculator_data as Record<string, any> || {};
      
      const permanentSubmission = await createSubmission({
        user_id: user.id,
        
        // Migrate all calculator data
        company_name: tempSubmission.company_name,
        contact_email: tempSubmission.email,
        phone: registrationData.phone || tempSubmission.phone,
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
        
        // Preserve calculated results and timing
        total_leak: tempSubmission.total_revenue_leak,
        recovery_potential_70: tempSubmission.recovery_potential,
        lead_score: tempSubmission.lead_score
      });
      
      // 4. Create enhanced user profile
      await createUserProfile({
        user_id: user.id,
        actual_company_name: registrationData.actualCompany || tempSubmission.company_name,
        actual_role: registrationData.actualRole,
        phone: registrationData.phone,
        user_classification: determineUserClassification(registrationData, tempSubmission),
        business_model: registrationData.businessModel || 'internal',
        
        // Engagement and history tracking
        first_submission_date: tempSubmission.created_at,
        total_companies_analyzed: 1,
        engagement_score: calculateInitialEngagementScore(tempSubmission),
        
        // Attribution data
        attribution_data: {
          utm_source: tempSubmission.utm_source,
          utm_medium: tempSubmission.utm_medium,
          utm_campaign: tempSubmission.utm_campaign,
          referrer_url: tempSubmission.referrer_url,
          first_visit: tempSubmission.created_at
        }
      });
      
      // 5. Mark temporary submission as converted
      await updateTemporarySubmission(tempId, {
        converted_to_user_id: user.id,
        conversion_completed_at: new Date().toISOString()
      });
      
      // 6. Trigger registration completion workflows
      await triggerEmailSequence('registration_completed', {
        email: user.email,
        company: tempSubmission.company_name,
        temp_id: tempId,
        user_id: user.id,
        recovery_potential: tempSubmission.recovery_potential,
        user_classification: determineUserClassification(registrationData, tempSubmission)
      });
      
      // 7. Trigger Twenty CRM integration
      try {
        const crmSubmission: CalculatorSubmission = {
          id: permanentSubmission.id,
          email: user.email!,
          company_name: registrationData.actualCompany || tempSubmission.company_name,
          industry: tempSubmission.industry || '',
          current_arr: calculatorData.step_1?.currentARR || 0,
          monthly_leads: calculatorData.step_2?.monthlyLeads || 0,
          average_deal_value: calculatorData.step_2?.averageDealValue || 0,
          lead_response_time_hours: calculatorData.step_2?.leadResponseTimeHours || 0,
          monthly_free_signups: calculatorData.step_3?.monthlyFreeSignups || 0,
          free_to_paid_conversion_rate: calculatorData.step_3?.freeToPaidConversionRate || 0,
          monthly_mrr: calculatorData.step_3?.monthlyMRR || 0,
          failed_payment_rate: calculatorData.step_4?.failedPaymentRate || 0,
          manual_hours_per_week: calculatorData.step_4?.manualHoursPerWeek || 0,
          hourly_rate: calculatorData.step_4?.hourlyRate || 0,
          lead_score: tempSubmission.lead_score || 0,
          calculations: {
            leadResponseLoss: 0,
            failedPaymentLoss: 0,
            selfServeGap: 0,
            processLoss: 0,
            totalLeakage: tempSubmission.total_revenue_leak || 0,
            potentialRecovery70: tempSubmission.recovery_potential || 0,
            potentialRecovery85: Math.round((tempSubmission.recovery_potential || 0) * 1.2)
          }
        };
        
        console.log('🔗 Triggering CRM integration for user registration...');
        const crmResult = await integrations.processSubmission(crmSubmission);
        
        if (crmResult.success) {
          console.log('✅ CRM integration successful:', crmResult.results);
        } else {
          console.warn('⚠️ CRM integration failed:', crmResult.errors);
        }
      } catch (crmError) {
        console.error('❌ CRM integration error during registration:', crmError);
        // Don't fail registration due to CRM integration issues
      }
      
      // 8. Update CRM with full user data via N8N
      try {
        await triggerN8NWorkflow('crm-integration', {
          action: 'update_contact_registration',
          user_id: user.id,
          temp_id: tempId,
          registration_data: registrationData,
          submission_data: permanentSubmission,
          user_classification: determineUserClassification(registrationData, tempSubmission)
        });
      } catch (n8nError) {
        console.error('❌ N8N workflow error during registration:', n8nError);
        // Don't fail registration due to N8N integration issues
      }
      
      // 9. Cancel any pending abandonment emails
      await cancelPendingAbandonmentEmails(tempId);
      
      return { user, submission: permanentSubmission };
    }
    
    return { user, submission: null };
    
  } catch (error) {
    console.error('Failed to handle user registration:', error);
    throw error;
  }
};

// Background automation processing (to be called periodically)
export const processAutomationTasks = async () => {
  try {
    // Run abandonment recovery
    await setupAbandonmentRecovery();
    
    // Process consultant detection for recent submissions
    const recentSubmissions = await supabase
      .from('temporary_submissions')
      .select('temp_id')
      .gte('last_activity_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .is('user_classification', null);
    
    if (recentSubmissions.data) {
      for (const submission of recentSubmissions.data) {
        await detectAndHandleConsultants(submission.temp_id);
      }
    }
    
    console.log('Automation tasks processed successfully');
  } catch (error) {
    console.error('Error processing automation tasks:', error);
  }
};