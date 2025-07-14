import { 
  saveCalculatorProgress, 
  triggerN8NWorkflow, 
  getTempId, 
  triggerEmailSequence 
} from "./coreDataCapture";
import { 
  detectAndHandleConsultants 
} from "./advancedAutomation";
import { getTemporarySubmission } from "@/lib/submission";

// Email validation utility
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const businessDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
  
  if (!emailRegex.test(email)) return false;
  
  const domain = email.split('@')[1].toLowerCase();
  // Prefer business emails over personal ones
  return !businessDomains.includes(domain);
};

// Calculate preliminary lead score for early qualification
export const calculatePreliminaryLeadScore = (progressData: any): number => {
  let score = 0;
  
  // Handle null progressData gracefully
  if (!progressData) {
    console.warn('calculatePreliminaryLeadScore: progressData is null, returning default score');
    return 0;
  }
  
  const calculatorData = progressData.calculator_data || {};
  
  // Company size indicators
  const currentARR = calculatorData.step_1?.currentARR || 0;
  if (currentARR > 10000000) score += 30; // $10M+ ARR
  else if (currentARR > 1000000) score += 20; // $1M+ ARR
  else if (currentARR > 100000) score += 10; // $100K+ ARR
  
  // Lead volume indicators
  const monthlyLeads = calculatorData.step_2?.monthlyLeads || 0;
  if (monthlyLeads > 1000) score += 20;
  else if (monthlyLeads > 100) score += 15;
  else if (monthlyLeads > 50) score += 10;
  
  // Deal value indicators
  const averageDealValue = calculatorData.step_2?.averageDealValue || 0;
  if (averageDealValue > 50000) score += 25;
  else if (averageDealValue > 10000) score += 15;
  else if (averageDealValue > 1000) score += 10;
  
  // Industry bonus
  const industry = calculatorData.step_1?.industry;
  if (['technology', 'finance', 'healthcare'].includes(industry)) {
    score += 15;
  }
  
  return Math.min(score, 100);
};

// Get complete calculator data for final calculations
export const getCompleteCalculatorData = async (tempId: string) => {
  try {
    const submission = await getTemporarySubmission(tempId);
    return submission?.calculator_data as Record<string, any> || {};
  } catch (error) {
    console.error('Error getting complete calculator data:', error);
    return {};
  }
};

// Import enhanced calculation functions
import {
  calculateLeadResponseImpact,
  calculateFailedPaymentLoss,
  calculateSelfServeGap,
  calculateProcessInefficiency,
  calculateEnhancedLeadScore,
  validateRecoveryAssumptions,
  INDUSTRY_BENCHMARKS,
  RECOVERY_SYSTEMS
} from "./calculator/enhancedCalculations";

// Calculate comprehensive revenue leak results with enhanced formulas
export const calculateRevenueLeaks = (allData: Record<string, any>) => {
  const step1 = allData.step_1 || {};
  const step2 = allData.step_2 || {};
  const step3 = allData.step_3 || {};
  const step4 = allData.step_4 || {};

  // Extract data with defaults
  const monthlyLeads = step2.monthlyLeads || 0;
  const averageDealValue = step2.averageDealValue || 0;
  const leadResponseTime = step2.leadResponseTimeHours || 0;
  const monthlyMRR = step3.monthlyMRR || 0;
  const failedPaymentRate = step4.failedPaymentRate || 0;
  const monthlyFreeSignups = step3.monthlyFreeSignups || 0;
  const currentConversionRate = step3.freeToPaidConversionRate || 0;
  const manualHours = step4.manualHoursPerWeek || 0;
  const hourlyRate = step4.hourlyRate || 0;
  const currentARR = step1.currentARR || 0;
  const industry = step1.industry || 'other';

  // Enhanced lead response loss calculation (exponential decay)
  const responseImpact = calculateLeadResponseImpact(leadResponseTime, averageDealValue);
  const leadResponseLoss = monthlyLeads * averageDealValue * (1 - responseImpact) * 12;

  // Enhanced failed payment loss calculation (with recovery rates)
  const recoverySystemType = determineRecoverySystemType(currentARR, monthlyMRR);
  const failedPaymentLoss = calculateFailedPaymentLoss(monthlyMRR, failedPaymentRate, recoverySystemType);

  // Enhanced self-serve gap calculation (industry-specific benchmarks)
  const selfServeGapLoss = calculateSelfServeGap(
    monthlyFreeSignups,
    currentConversionRate,
    monthlyMRR,
    industry
  );

  // Enhanced process inefficiency calculation (updated multipliers)
  const processInefficiencyLoss = calculateProcessInefficiency(manualHours, hourlyRate);

  // Total calculations
  const totalLeak = leadResponseLoss + failedPaymentLoss + selfServeGapLoss + processInefficiencyLoss;
  const leakPercentage = currentARR > 0 ? (totalLeak / currentARR) * 100 : 0;

  // Validate recovery potential assumptions
  const recoveryValidation = validateRecoveryAssumptions({
    currentARR,
    grossRetention: 85, // Default assumption - could be made dynamic
    netRetention: 105, // Default assumption - could be made dynamic
    customerSatisfaction: 7.5, // Default assumption - could be made dynamic
    hasRevOps: currentARR > 1000000 // Assume RevOps for companies >$1M ARR
  });

  // Recovery potential scenarios (with validation)
  const recoveryPotential70 = recoveryValidation.canAchieve70 ? totalLeak * 0.7 : totalLeak * 0.5;
  const recoveryPotential85 = recoveryValidation.canAchieve85 ? totalLeak * 0.85 : totalLeak * 0.7;

  // Enhanced lead score calculation
  const leadScore = calculateEnhancedLeadScore({
    currentARR,
    totalLeak,
    monthlyLeads,
    averageDealValue,
    industry,
    hasProductUsage: false, // Could be enhanced with actual product usage data
    engagementScore: 50 // Default - could be enhanced with actual engagement tracking
  });

  // Get industry benchmark for reference
  const industryBenchmark = INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS['other'];
  const recoverySystem = RECOVERY_SYSTEMS[recoverySystemType];

  return {
    leadResponseLoss,
    failedPaymentLoss,
    selfServeGapLoss,
    processInefficiencyLoss,
    totalLeak,
    leakPercentage,
    recoveryPotential70,
    recoveryPotential85,
    leadScore,
    // Enhanced breakdown with new insights
    breakdown: {
      leadResponse: {
        monthlyLeads,
        averageDealValue,
        responseTimeHours: leadResponseTime,
        conversionImpact: responseImpact,
        annualLoss: leadResponseLoss,
        dealSizeTier: averageDealValue > 100000 ? 'Enterprise' : averageDealValue > 25000 ? 'Mid-Market' : 'SMB'
      },
      failedPayments: {
        monthlyMRR,
        failureRate: failedPaymentRate,
        annualLoss: failedPaymentLoss,
        recoverySystem: recoverySystem.name,
        recoveryRate: recoverySystem.recoveryRate * 100,
        actualLossAfterRecovery: failedPaymentLoss
      },
      selfServeGap: {
        monthlySignups: monthlyFreeSignups,
        currentConversion: currentConversionRate,
        industryBenchmark: industryBenchmark.conversionRate,
        industryName: industryBenchmark.name,
        annualLoss: selfServeGapLoss,
        gapPercentage: Math.max(0, industryBenchmark.conversionRate - currentConversionRate)
      },
      processInefficiency: {
        weeklyHours: manualHours,
        hourlyRate,
        automationPotential: 70,
        annualLoss: processInefficiencyLoss,
        revenueGeneratingPotential: 32
      },
      recoveryValidation: {
        canAchieve70: recoveryValidation.canAchieve70,
        canAchieve85: recoveryValidation.canAchieve85,
        limitations: recoveryValidation.reasons
      }
    }
  };
};

// Helper function to determine recovery system type based on company profile
const determineRecoverySystemType = (currentARR: number, monthlyMRR: number): keyof typeof RECOVERY_SYSTEMS => {
  if (currentARR > 10000000 || monthlyMRR > 500000) {
    return 'best-in-class';
  } else if (currentARR > 1000000 || monthlyMRR > 50000) {
    return 'advanced';
  } else {
    return 'basic';
  }
};

// Enhanced final lead score calculation using new framework
const calculateFinalLeadScore = (data: {
  currentARR: number;
  totalLeak: number;
  monthlyLeads: number;
  averageDealValue: number;
  industry?: string;
}): number => {
  return calculateEnhancedLeadScore({
    currentARR: data.currentARR,
    totalLeak: data.totalLeak,
    monthlyLeads: data.monthlyLeads,
    averageDealValue: data.averageDealValue,
    industry: data.industry,
    hasProductUsage: false, // Could be enhanced with actual product usage data
    engagementScore: 50 // Default - could be enhanced with actual engagement tracking
  });
};

// Save calculated results to database
export const saveCalculatorResults = async (tempId: string, results: any) => {
  try {
    await saveCalculatorProgress({
      total_revenue_leak: results.totalLeak,
      recovery_potential: results.recoveryPotential70,
      lead_score: results.leadScore,
      calculation_results: results
    }, 5);
  } catch (error) {
    console.error('Error saving calculator results:', error);
  }
};

// Step 1: Company Information with immediate email capture
export const handleStep1Complete = async (companyData: any, setCurrentStep: (step: number) => void) => {
  const stepData = {
    companyName: companyData.companyName,
    email: companyData.email,
    industry: companyData.industry,
    currentARR: companyData.currentARR || 0
  };
  
  // Validate minimum requirements
  if (!stepData.companyName?.trim() || !stepData.email?.trim()) {
    throw new Error('Company name and email are required');
  }
  
  if (!isValidEmail(stepData.email)) {
    throw new Error('Please provide a valid business email address');
  }
  
  // Save data and trigger automation
  const progressData = await saveCalculatorProgress(stepData, 1);
  
  // Additional CRM integration through N8N
  await triggerN8NWorkflow('crm-integration', {
    action: 'create_or_update_contact',
    contact_email: stepData.email,
    company_name: stepData.companyName,
    industry: stepData.industry,
    current_arr: stepData.currentARR,
    temp_id: getTempId(),
    source: 'revenue_calculator_step_1'
  });
  
  // Trigger consultant detection
  await detectAndHandleConsultants(getTempId());
  
  // Proceed to next step
  setCurrentStep(2);
  return progressData;
};

// Step 2: Revenue Metrics with enhanced tracking
export const handleStep2Complete = async (revenueData: any, setCurrentStep: (step: number) => void) => {
  const stepData = {
    monthlyLeads: revenueData.monthlyLeads || 0,
    averageDealValue: revenueData.averageDealValue || 0,
    leadResponseTimeHours: revenueData.leadResponseTimeHours || 0
  };
  
  const progressData = await saveCalculatorProgress(stepData, 2);
  
  // Calculate preliminary lead score for early qualification
  const preliminaryScore = calculatePreliminaryLeadScore(progressData);
  
  // Trigger lead qualification workflow in N8N
  await triggerN8NWorkflow('lead-qualification', {
    temp_id: getTempId(),
    preliminary_score: preliminaryScore,
    company_data: progressData.calculator_data,
    step_completed: 2
  });
  
  setCurrentStep(3);
  return progressData;
};

// Step 3: Self-Serve Metrics
export const handleStep3Complete = async (selfServeData: any, setCurrentStep: (step: number) => void) => {
  const stepData = {
    monthlyFreeSignups: selfServeData.monthlyFreeSignups || 0,
    freeToPaidConversionRate: selfServeData.freeToPaidConversionRate || 0,
    monthlyMRR: selfServeData.monthlyMRR || 0,
    failedPaymentRate: selfServeData.failedPaymentRate || 0
  };
  
  const progressData = await saveCalculatorProgress(stepData, 3);
  setCurrentStep(4);
  return progressData;
};

// Step 4: Operations Data and Results Calculation
export const handleStep4Complete = async (operationsData: any, setCurrentStep: (step: number) => void, showResults: (results: any) => void) => {
  const stepData = {
    manualHoursPerWeek: operationsData.manualHoursPerWeek || 0,
    hourlyRate: operationsData.hourlyRate || 0,
    failedPaymentRate: operationsData.failedPaymentRate || 0
  };
  
  // Save final step data
  const progressData = await saveCalculatorProgress(stepData, 4);
  
  // Calculate comprehensive results
  const allData = await getCompleteCalculatorData(getTempId());
  const results = calculateRevenueLeaks(allData);
  
  // Save calculated results with enhanced data
  await saveCalculatorResults(getTempId(), results);
  
  // Trigger results and lead scoring workflows
  await triggerN8NWorkflow('results-calculated', {
    temp_id: getTempId(),
    results: results,
    company_data: allData,
    lead_score: results.leadScore
  });
  
  // Show results to user
  setCurrentStep(5);
  showResults(results);
  return { progressData, results };
};