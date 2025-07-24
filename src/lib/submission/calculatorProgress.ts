// Calculator-specific progress tracking

import { TemporarySubmissionData } from "./types";
import { getTempId } from "./trackingHelpers";
import { getTemporarySubmission, saveTemporarySubmission } from "./submissionStorage";
import { integrationLogger } from "../integrationLogger";

// Update completion progress
export const updateCalculatorProgress = async (
  currentStep: number,
  stepData: Record<string, any>,
  calculations?: Record<string, any>
) => {
  const tempId = getTempId();
  
  try {
    const existing = await getTemporarySubmission(tempId);
    const currentCalculatorData = existing?.calculator_data || {};
    
    // Merge new step data with existing calculator data
    const updatedCalculatorData = {
      ...(currentCalculatorData as Record<string, any>),
      [`step_${currentStep}`]: stepData,
    };

    // Calculate completion percentage
    const totalSteps = 5; // Adjust based on your calculator steps
    const completionPercentage = Math.round((currentStep / totalSteps) * 100);

    const updateData: Partial<TemporarySubmissionData> = {
      current_step: currentStep,
      steps_completed: currentStep,
      completion_percentage: completionPercentage,
      calculator_data: updatedCalculatorData,
      calculator_interactions: (existing?.calculator_interactions || 0) + 1,
    };

    // Add calculated results if provided
    if (calculations) {
      updateData.total_revenue_leak = Math.round(calculations.totalLeakage || 0);
      updateData.recovery_potential = Math.round(calculations.potentialRecovery70 || 0);
      // For now, set a basic lead score - it will be properly calculated in useSaveResults
      updateData.lead_score = Math.round(50); // Default score, will be overridden later
    }

    // Extract email and company info if in step data
    if (stepData.email) updateData.email = stepData.email;
    if (stepData.companyName) updateData.company_name = stepData.companyName;
    if (stepData.industry) updateData.industry = stepData.industry;

    const result = await saveTemporarySubmission(updateData);
    
    // Log calculator progress
    try {
      await integrationLogger.logCalculatorProgress(
        tempId,
        currentStep,
        stepData,
        calculations
      );
    } catch (logError) {
      console.error('Error logging calculator progress:', logError);
      // Don't throw - logging failures shouldn't break the main flow
    }
    
    return result;
  } catch (error) {
    console.error('Error updating calculator progress:', error);
    
    // Log system error
    try {
      await integrationLogger.logSystemError(
        'calculator_progress_update',
        error as Error,
        { currentStep, stepData, calculations }
      );
    } catch (logError) {
      console.error('Error logging system error:', logError);
    }
    
    throw error;
  }
};