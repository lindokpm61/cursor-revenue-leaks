// Calculator-specific progress tracking

import { TemporarySubmissionData } from "./types";
import { getTempId } from "./trackingHelpers";
import { getTemporarySubmission, saveTemporarySubmission } from "./submissionStorage";

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

    return await saveTemporarySubmission(updateData);
  } catch (error) {
    console.error('Error updating calculator progress:', error);
    throw error;
  }
};