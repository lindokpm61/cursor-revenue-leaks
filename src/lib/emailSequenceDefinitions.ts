// Email sequence definitions with N8N workflow mapping
export const EMAIL_SEQUENCES = {
  // Welcome and engagement sequences
  calculator_started: {
    trigger: 'Step 1 completed with email',
    delay: 0,
    n8n_workflow: 'welcome-calculator',
    smartlead_campaign: 'calculator-welcome',
    description: 'Welcome user and encourage completion'
  },
  
  calculator_progress: {
    trigger: 'Step 2 or 3 completed',
    delay: 300000, // 5 minutes
    n8n_workflow: 'progress-encouragement',
    smartlead_campaign: 'calculator-progress',
    description: 'Encourage continued progress'
  },
  
  calculator_completed: {
    trigger: 'Step 4 completed (results calculated)',
    delay: 0,
    n8n_workflow: 'results-notification',
    smartlead_campaign: 'results-ready',
    description: 'Notify results are ready, encourage registration'
  },
  
  // Abandonment recovery sequences
  abandoned_step_1: {
    trigger: '2 hours after Step 1 with no progress',
    delay: 7200000, // 2 hours
    n8n_workflow: 'abandonment-step1',
    smartlead_campaign: 'abandonment-early',
    description: 'Encourage completion of company information'
  },
  
  abandoned_step_2: {
    trigger: '2 hours after Step 2 with no progress',
    delay: 7200000,
    n8n_workflow: 'abandonment-step2',
    smartlead_campaign: 'abandonment-mid',
    description: 'Help complete revenue metrics'
  },
  
  abandoned_step_3: {
    trigger: '2 hours after Step 3 with no progress',
    delay: 7200000,
    n8n_workflow: 'abandonment-step3',
    smartlead_campaign: 'abandonment-late',
    description: 'Almost done encouragement'
  },
  
  abandoned_results: {
    trigger: '24 hours after results with no registration',
    delay: 86400000, // 24 hours
    n8n_workflow: 'abandonment-results',
    smartlead_campaign: 'abandonment-results',
    description: 'Results are waiting, encourage registration'
  },
  
  // High-value prospect sequences
  high_value_alert: {
    trigger: 'Results show >$100M recovery potential',
    delay: 0,
    n8n_workflow: 'high-value-alert',
    smartlead_campaign: 'high-value-prospects',
    description: 'Priority handling for large opportunities'
  },
  
  // Conversion and onboarding
  registration_completed: {
    trigger: 'User completes registration',
    delay: 0,
    n8n_workflow: 'registration-welcome',
    smartlead_campaign: 'onboarding-welcome',
    description: 'Welcome registered user, next steps'
  },
  
  consultant_detected: {
    trigger: 'Multiple companies from same email domain',
    delay: 300000, // 5 minutes
    n8n_workflow: 'consultant-outreach',
    smartlead_campaign: 'consultant-partnership',
    description: 'Special handling for consultants'
  },
  
  // Step completion sequences
  step1_completed: {
    trigger: 'Step 1 form completion',
    delay: 0,
    n8n_workflow: 'step1-welcome',
    smartlead_campaign: 'calculator-step1',
    description: 'Welcome and step 2 guidance'
  },
  
  step2_completed: {
    trigger: 'Step 2 form completion',
    delay: 0,
    n8n_workflow: 'step2-progress',
    smartlead_campaign: 'calculator-step2',
    description: 'Progress encouragement'
  },
  
  step3_completed: {
    trigger: 'Step 3 form completion',
    delay: 0,
    n8n_workflow: 'step3-nearend',
    smartlead_campaign: 'calculator-step3',
    description: 'Almost complete motivation'
  }
};

// Get sequence configuration by type
export const getSequenceConfig = (sequenceType: string) => {
  return EMAIL_SEQUENCES[sequenceType as keyof typeof EMAIL_SEQUENCES] || null;
};

// Get all abandonment sequences
export const getAbandonmentSequences = () => {
  return Object.entries(EMAIL_SEQUENCES)
    .filter(([key]) => key.startsWith('abandoned_'))
    .map(([key, config]) => ({ type: key, ...config }));
};

// Get all step completion sequences
export const getStepCompletionSequences = () => {
  return Object.entries(EMAIL_SEQUENCES)
    .filter(([key]) => key.includes('step') && key.includes('completed'))
    .map(([key, config]) => ({ type: key, ...config }));
};

// Schedule abandonment sequence
export const scheduleAbandonmentSequence = async (sequenceType: string, contactData: any) => {
  const config = getSequenceConfig(sequenceType);
  if (!config) return;
  
  // This would typically integrate with your scheduling system
  console.log(`Scheduling ${sequenceType} for ${contactData.email} in ${config.delay}ms`);
  
  // In a real implementation, you might use setTimeout or a job queue
  setTimeout(async () => {
    // Check if user has completed the step before sending abandonment email
    // This would require checking the current state of their submission
    console.log(`Triggering abandonment sequence: ${sequenceType}`);
  }, config.delay);
};

// Cancel previous abandonment sequences
export const cancelPreviousAbandonmentSequences = async (tempId: string) => {
  // This would typically clear any pending abandonment sequences for this user
  console.log(`Cancelling previous abandonment sequences for ${tempId}`);
  
  // In a real implementation, you would:
  // 1. Query the email_sequence_queue for pending abandonment sequences
  // 2. Mark them as cancelled
  // 3. Remove any scheduled jobs
};