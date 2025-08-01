import { supabase } from "@/integrations/supabase/client";
import { 
  saveTemporarySubmission, 
  getTemporarySubmission, 
  getTempId as getBaseTempId,
  getTrackingData,
  scheduleEmailSequence,
  hasSequenceBeenTriggered
} from "@/lib/submission";

// Enhanced temporary ID generation with UUID format
export const generateTempId = (): string => {
  // Generate a proper UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Get or create temporary ID with session tracking (UUID format)
export const getTempId = (): string => {
  let tempId = localStorage.getItem('calculator_temp_id'); // Use same key as trackingHelpers
  
  // Clear invalid temp_id format (not UUID)
  if (tempId && !tempId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    console.log('🧹 [coreDataCapture] Clearing invalid temp_id:', tempId);
    localStorage.removeItem('calculator_temp_id');
    tempId = null;
  }
  
  if (!tempId) {
    tempId = generateTempId();
    localStorage.setItem('calculator_temp_id', tempId);
    console.log('🆔 [coreDataCapture] Generated new UUID temp_id:', tempId);
    
    // Track session start
    trackSessionStart(tempId);
  }
  return tempId;
};

// Track session start with initial data capture
const trackSessionStart = async (tempId: string) => {
  try {
    const sessionData = {
      temp_id: tempId,
      session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      current_step: 1,
      page_views: 1,
      calculator_interactions: 0,
      ...getTrackingData(),
    };
    
    await saveTemporarySubmission(sessionData);
  } catch (error) {
    console.error('Failed to track session start:', error);
  }
};

// Get URL parameters for UTM tracking
const getUrlParameter = (name: string): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
};

// Abandonment recovery scheduling
export const scheduleAbandonmentRecovery = async (tempId: string, progressData: any) => {
  try {
    // Cancel any existing abandonment sequences first
    await supabase
      .from('email_sequence_analytics')
      .update({ sequence_type: 'cancelled' })
      .eq('temp_submission_id', tempId)
      .like('sequence_type', 'abandonment_%');

    // Determine appropriate abandonment sequence based on progress
    let abandonmentType = 'abandonment_step1';
    let delayHours = 24;

    if (progressData.completion_percentage >= 75) {
      abandonmentType = 'abandonment_results';
      delayHours = 12; // Shorter delay for near-completion
    } else if (progressData.completion_percentage >= 50) {
      abandonmentType = 'abandonment_step3';
      delayHours = 18;
    } else if (progressData.completion_percentage >= 25) {
      abandonmentType = 'abandonment_step2';
      delayHours = 24;
    }

    // Only schedule if we have an email
    if (!progressData.email) return;

    // Schedule the abandonment recovery
    const scheduledFor = new Date();
    scheduledFor.setHours(scheduledFor.getHours() + delayHours);

    await scheduleEmailSequence({
      temp_id: tempId,
      contact_email: progressData.email,
      sequence_type: abandonmentType,
      scheduled_for: scheduledFor.toISOString(),
      contact_data: {
        company_name: progressData.company_name,
        completion_percentage: progressData.completion_percentage,
        current_step: progressData.current_step,
        recovery_potential: progressData.recovery_potential,
        abandoned_at: new Date().toISOString(),
        delay_hours: delayHours
      },
      status: 'pending'
    });

    console.log(`Abandonment recovery scheduled: ${abandonmentType} for ${tempId} in ${delayHours}h`);
  } catch (error) {
    console.error('Error scheduling abandonment recovery:', error);
  }
};

// N8N webhook integration for email automation
export const triggerN8NWorkflow = async (workflowType: string, data: any) => {
  try {
    // Ensure temp_id is provided and valid (allow null for monitoring analytics)
    if (!data.temp_id && workflowType !== 'analytics-reporting' && workflowType !== 'system-maintenance') {
      console.error('triggerN8NWorkflow: temp_id is required for workflow type:', workflowType);
      return null;
    }
    
    // Use edge function to trigger N8N workflows with placeholder configuration
    const response = await supabase.functions.invoke('n8n-trigger', {
      body: {
        workflow_type: workflowType,
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          source: 'revenue_calculator'
        }
      }
    });
    
    if (response.error) {
      console.error(`N8N workflow ${workflowType} failed:`, response.error);
      // Don't throw error - just log and continue
      return null;
    }
    
    const result = response.data;
    
    // Track N8N execution for status monitoring only if we have a valid execution_id
    if (result?.execution_id && data.temp_id) {
      await updateN8NExecutionStatus(data.temp_id, workflowType, result.execution_id);
    }
    
    return result;
  } catch (error) {
    console.error(`Failed to trigger N8N workflow ${workflowType}:`, error);
    // Don't block user flow on automation errors
    return null;
  }
};

// Update N8N execution status in database
const updateN8NExecutionStatus = async (tempId: string, workflowType: string, executionId: string) => {
  try {
    if (!tempId) {
      console.error('updateN8NExecutionStatus: tempId is required');
      return;
    }
    
    const existing = await getTemporarySubmission(tempId);
    if (!existing) {
      console.error('updateN8NExecutionStatus: No existing submission found for tempId:', tempId);
      return;
    }
    
    const updatedStatus = {
      ...(existing.n8n_workflow_status as Record<string, any> || {}),
      [workflowType]: {
        execution_id: executionId,
        triggered_at: new Date().toISOString(),
        status: 'running'
      }
    };
    
    await saveTemporarySubmission({
      temp_id: tempId,
      n8n_workflow_status: updatedStatus
    });
  } catch (error) {
    console.error('Failed to update N8N execution status:', error);
  }
};

// Local function to check triggered sequences in temporary submission
const checkLocalTriggeredSequences = async (tempId: string, sequenceType: string): Promise<boolean> => {
  try {
    const existing = await getTemporarySubmission(tempId);
    if (!existing) return false;
    
    const triggeredSequences = existing.email_sequences_triggered as string[] || [];
    const isAlreadyTriggered = triggeredSequences.includes(sequenceType);
    
    if (isAlreadyTriggered) {
      console.log(`Email sequence ${sequenceType} already triggered for ${tempId}`);
    }
    
    return isAlreadyTriggered;
  } catch (error) {
    console.error('Failed to check triggered sequences:', error);
    return false;
  }
};

// Record triggered email sequence
const recordTriggeredSequence = async (tempId: string, sequenceType: string, n8nResult: any) => {
  try {
    const existing = await getTemporarySubmission(tempId);
    if (!existing) return;
    
    const triggeredSequences = [...(existing.email_sequences_triggered as string[] || []), sequenceType];
    
    await saveTemporarySubmission({
      temp_id: tempId,
      email_sequences_triggered: triggeredSequences,
      last_email_sent_at: new Date().toISOString(),
      email_engagement_score: (existing.email_engagement_score || 0) + 10
    });
    
    // Also add to email sequence queue for tracking
    await supabase
      .from('email_sequence_analytics')
      .insert([{
        temp_submission_id: tempId,
        sequence_type: sequenceType,
        sent_at: new Date().toISOString(),
        recipient_email: existing.email,
        engagement_score: 0,
        n8n_execution_id: n8nResult?.execution_id
      }]);
  } catch (error) {
    console.error('Failed to record triggered sequence:', error);
  }
};

// Schedule follow-up email sequences
const scheduleFollowUpSequences = async (initialSequenceType: string, contactData: any) => {
  try {
    const followUpSchedule: Record<string, { delay: number, sequence: string }[]> = {
      'step1_incomplete': [
        { delay: 60 * 60 * 1000, sequence: 'step1_reminder' }, // 1 hour
        { delay: 24 * 60 * 60 * 1000, sequence: 'step1_followup' } // 24 hours
      ],
      'step2_incomplete': [
        { delay: 2 * 60 * 60 * 1000, sequence: 'step2_reminder' }, // 2 hours
        { delay: 48 * 60 * 60 * 1000, sequence: 'analysis_benefits' } // 48 hours
      ],
      'results_ready': [
        { delay: 30 * 60 * 1000, sequence: 'results_review_reminder' }, // 30 minutes
        { delay: 7 * 24 * 60 * 60 * 1000, sequence: 'implementation_guide' } // 7 days
      ]
    };
    
    const followUps = followUpSchedule[initialSequenceType] || [];
    
    for (const followUp of followUps) {
      const scheduledFor = new Date(Date.now() + followUp.delay).toISOString();
      
      await supabase
        .from('email_sequence_analytics')
        .insert([{
          temp_submission_id: contactData.temp_id,
          sequence_type: followUp.sequence,
          sent_at: scheduledFor,
          recipient_email: contactData.email,
          engagement_score: 0
        }]);
    }
  } catch (error) {
    console.error('Failed to schedule follow-up sequences:', error);
  }
};

// Enhanced email sequence triggering with N8N integration
export const triggerEmailSequence = async (sequenceType: string, contactData: any) => {
  try {
    // Validate required data
    if (!contactData.temp_id) {
      console.error('triggerEmailSequence: temp_id is required');
      return;
    }

    // Check if sequence already triggered to avoid duplicates
    const alreadyTriggered = await hasSequenceBeenTriggered(contactData.temp_id, sequenceType);
    if (alreadyTriggered) {
      return; // Exit silently to avoid spam logs
    }

    // Schedule abandonment recovery when user progresses (cancel previous ones)
    if (sequenceType.includes('step_') && contactData.completion_percentage > 0) {
      await scheduleAbandonmentRecovery(contactData.temp_id, contactData);
    }
    
    // Trigger N8N workflow for email automation
    const n8nResult = await triggerN8NWorkflow('email-automation', {
      sequence_type: sequenceType,
      contact_email: contactData.email,
      company_name: contactData.company,
      temp_id: contactData.temp_id,
      recovery_potential: contactData.recovery_potential,
      calculator_step: contactData.step,
      lead_score: contactData.lead_score,
      
      // Additional context for personalization
      industry: contactData.industry,
      current_arr: contactData.current_arr,
      utm_data: {
        source: contactData.utm_source,
        medium: contactData.utm_medium,
        campaign: contactData.utm_campaign
      }
    });
    
    // Record the triggered sequence
    await recordTriggeredSequence(contactData.temp_id, sequenceType, n8nResult);
    
    // Schedule follow-up sequences if needed
    await scheduleFollowUpSequences(sequenceType, contactData);
    
  } catch (error) {
    console.error(`Failed to trigger email sequence ${sequenceType}:`, error);
  }
};

// Get existing calculator data from temporary submission
const getExistingCalculatorData = async (tempId: string) => {
  try {
    const existing = await getTemporarySubmission(tempId);
    return existing?.calculator_data as Record<string, any> || {};
  } catch (error) {
    console.error('Failed to get existing calculator data:', error);
    return {};
  }
};

// Get step timestamps for tracking completion time
const getStepTimestamps = async (tempId: string) => {
  try {
    const existing = await getTemporarySubmission(tempId);
    const calculatorData = existing?.calculator_data as Record<string, any> || {};
    return calculatorData.step_timestamps || {};
  } catch (error) {
    console.error('Failed to get step timestamps:', error);
    return {};
  }
};

// Get existing contact information
const getExistingEmail = async (tempId: string) => {
  try {
    const existing = await getTemporarySubmission(tempId);
    return existing?.email || null;
  } catch (error) {
    return null;
  }
};

const getExistingCompany = async (tempId: string) => {
  try {
    const existing = await getTemporarySubmission(tempId);
    return existing?.company_name || null;
  } catch (error) {
    return null;
  }
};

const getExistingIndustry = async (tempId: string) => {
  try {
    const existing = await getTemporarySubmission(tempId);
    return existing?.industry || null;
  } catch (error) {
    return null;
  }
};

const getExistingPhone = async (tempId: string) => {
  try {
    // Note: phone field doesn't exist in temporary_submissions table
    return null;
  } catch (error) {
    return null;
  }
};

// Increment interaction count for engagement tracking
const incrementInteractionCount = async (tempId: string): Promise<number> => {
  try {
    const existing = await getTemporarySubmission(tempId);
    const newCount = (existing?.calculator_interactions || 0) + 1;
    
    await saveTemporarySubmission({
      temp_id: tempId,
      calculator_interactions: newCount
    });
    
    return newCount;
  } catch (error) {
    console.error('Failed to increment interaction count:', error);
    return 0;
  }
};

// Update time spent on calculator
const updateTimeSpent = async (tempId: string): Promise<number> => {
  try {
    const sessionStart = localStorage.getItem(`session_start_${tempId}`);
    if (!sessionStart) {
      localStorage.setItem(`session_start_${tempId}`, Date.now().toString());
      return 0;
    }
    
    const timeSpent = Math.floor((Date.now() - parseInt(sessionStart)) / 1000);
    
    await saveTemporarySubmission({
      temp_id: tempId,
      time_spent_seconds: timeSpent
    });
    
    return timeSpent;
  } catch (error) {
    console.error('Failed to update time spent:', error);
    return 0;
  }
};

// Trigger step-based email sequences
const triggerStepBasedEmailSequences = async (stepNumber: number, progressData: any) => {
  try {
    const sequenceMap: Record<number, string> = {
      1: 'step1_completed',
      2: 'step2_completed', 
      3: 'step3_completed',
      4: 'calculator_completed'
    };
    
    const sequenceType = sequenceMap[stepNumber];
    if (!sequenceType) return;
    
    // Only trigger if we have email
    if (!progressData.email) return;
    
    const contactData = {
      temp_id: progressData.temp_id,
      email: progressData.email,
      company: progressData.company_name,
      step: stepNumber,
      industry: progressData.industry,
      current_arr: progressData.calculator_data?.step_1?.currentARR,
      utm_source: progressData.utm_source,
      utm_medium: progressData.utm_medium,
      utm_campaign: progressData.utm_campaign,
      completion_percentage: progressData.completion_percentage,
      recovery_potential: progressData.recovery_potential,
      lead_score: progressData.lead_score
    };
    
    await triggerEmailSequence(sequenceType, contactData);
    
    // For step 4 (results), trigger additional high-value sequences if applicable
    if (stepNumber === 4 && contactData.recovery_potential > 100000000) {
      await triggerEmailSequence('high_value_alert', {
        ...contactData,
        priority: 'high',
        reason: 'high_recovery_potential'
      });
    }
  } catch (error) {
    console.error('Failed to trigger step-based email sequences:', error);
  }
};

// Track step completion for analytics - simplified to avoid permission issues
const trackStepCompletion = async (tempId: string, stepNumber: number) => {
  try {
    // Simply log the completion - avoid database writes that require special permissions
    console.log(`Step ${stepNumber} completed for temp_id: ${tempId}`);
    
    // Update existing temporary submission with step completion instead
    await saveTemporarySubmission({
      temp_id: tempId,
      last_activity_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to track step completion:', error);
  }
};

// Upsert temporary submission wrapper
const upsertTemporarySubmission = async (progressData: any) => {
  try {
    await saveTemporarySubmission(progressData);
  } catch (error) {
    console.error('Failed to upsert temporary submission:', error);
    throw error;
  }
};

// Progressive data capture with email integration
export const saveCalculatorProgress = async (stepData: any, stepNumber: number) => {
  try {
    const tempId = getTempId();
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // Prepare comprehensive data for saving
    const progressData = {
      temp_id: tempId,
      session_id: sessionId,
      current_step: stepNumber,
      steps_completed: stepNumber,
      completion_percentage: Math.round((stepNumber / 4) * 100),
      last_activity_at: new Date().toISOString(),
      
      // Merge new step data with existing calculator data
      calculator_data: {
        ...await getExistingCalculatorData(tempId),
        [`step_${stepNumber}`]: stepData,
        last_updated_step: stepNumber,
        step_timestamps: {
          ...await getStepTimestamps(tempId),
          [`step_${stepNumber}`]: new Date().toISOString()
        }
      },
      
      // Extract key fields for easy querying and email personalization
      email: stepData.email || await getExistingEmail(tempId),
      phone: stepData.phone || await getExistingPhone(tempId),
      company_name: stepData.companyName || await getExistingCompany(tempId),
      industry: stepData.industry || await getExistingIndustry(tempId),
      
      // Tracking data for attribution and personalization
      user_agent: navigator.userAgent,
      referrer_url: document.referrer,
      utm_source: getUrlParameter('utm_source'),
      utm_medium: getUrlParameter('utm_medium'),
      utm_campaign: getUrlParameter('utm_campaign'),
      
      // Engagement metrics
      calculator_interactions: await incrementInteractionCount(tempId),
      time_spent_seconds: await updateTimeSpent(tempId),
      
      // Update timestamps
      last_updated: new Date().toISOString()
    };
    
    // Save or update temporary submission
    await upsertTemporarySubmission(progressData);
    
    // Trigger appropriate email sequences based on step
    await triggerStepBasedEmailSequences(stepNumber, progressData);
    
    // Track engagement for lead scoring
    await trackStepCompletion(tempId, stepNumber);
    
    return progressData;
    
  } catch (error) {
    console.error('Failed to save calculator progress:', error);
    // Don't block user flow on save errors
    return null;
  }
};