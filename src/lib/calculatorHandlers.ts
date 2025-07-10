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

// Calculate comprehensive revenue leak results
export const calculateRevenueLeaks = (allData: Record<string, any>) => {
  const step1 = allData.step_1 || {};
  const step2 = allData.step_2 || {};
  const step3 = allData.step_3 || {};
  const step4 = allData.step_4 || {};

  // Lead response loss calculation
  const monthlyLeads = step2.monthlyLeads || 0;
  const averageDealValue = step2.averageDealValue || 0;
  const leadResponseTime = step2.leadResponseTimeHours || 0;
  
  // Response time impact: 1 hour = 100% conversion, 2 hours = 50%, 4+ hours = 25%
  let responseTimeMultiplier = 1.0;
  if (leadResponseTime > 4) responseTimeMultiplier = 0.25;
  else if (leadResponseTime > 2) responseTimeMultiplier = 0.5;
  else if (leadResponseTime > 1) responseTimeMultiplier = 0.75;
  
  const leadResponseLoss = (monthlyLeads * averageDealValue * (1 - responseTimeMultiplier)) * 12;

  // Failed payment loss calculation
  const monthlyMRR = step3.monthlyMRR || 0;
  const failedPaymentRate = (step4.failedPaymentRate || 0) / 100;
  const failedPaymentLoss = (monthlyMRR * failedPaymentRate * 12);

  // Self-serve gap loss calculation
  const monthlyFreeSignups = step3.monthlyFreeSignups || 0;
  const currentConversionRate = (step3.freeToPaidConversionRate || 0) / 100;
  const averagePrice = monthlyMRR / (monthlyFreeSignups * currentConversionRate || 1);
  
  // Industry benchmark conversion rates
  const benchmarkConversionRate = 0.15; // 15% benchmark
  const conversionGap = Math.max(0, benchmarkConversionRate - currentConversionRate);
  const selfServeGapLoss = (monthlyFreeSignups * conversionGap * averagePrice * 12);

  // Process inefficiency loss calculation
  const manualHours = (step4.manualHoursPerWeek || 0) * 52; // Annual hours
  const hourlyRate = step4.hourlyRate || 0;
  const automationSavings = 0.7; // 70% automation potential
  const processInefficiencyLoss = (manualHours * hourlyRate * automationSavings);

  // Total calculations
  const totalLeak = leadResponseLoss + failedPaymentLoss + selfServeGapLoss + processInefficiencyLoss;
  const currentARR = step1.currentARR || 0;
  const leakPercentage = currentARR > 0 ? (totalLeak / currentARR) * 100 : 0;

  // Recovery potential scenarios
  const recoveryPotential70 = totalLeak * 0.7;
  const recoveryPotential85 = totalLeak * 0.85;

  // Calculate lead score based on final data
  const leadScore = calculateFinalLeadScore({
    currentARR,
    totalLeak,
    monthlyLeads,
    averageDealValue,
    industry: step1.industry
  });

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
    breakdown: {
      leadResponse: {
        monthlyLeads,
        averageDealValue,
        responseTimeHours: leadResponseTime,
        conversionImpact: responseTimeMultiplier,
        annualLoss: leadResponseLoss
      },
      failedPayments: {
        monthlyMRR,
        failureRate: failedPaymentRate * 100,
        annualLoss: failedPaymentLoss
      },
      selfServeGap: {
        monthlySignups: monthlyFreeSignups,
        currentConversion: currentConversionRate * 100,
        benchmarkConversion: benchmarkConversionRate * 100,
        annualLoss: selfServeGapLoss
      },
      processInefficiency: {
        weeklyHours: step4.manualHoursPerWeek || 0,
        hourlyRate,
        automationPotential: automationSavings * 100,
        annualLoss: processInefficiencyLoss
      }
    }
  };
};

// Calculate final lead score with comprehensive data
const calculateFinalLeadScore = (data: {
  currentARR: number;
  totalLeak: number;
  monthlyLeads: number;
  averageDealValue: number;
  industry?: string;
}): number => {
  let score = 0;

  // Revenue size scoring (40 points max)
  if (data.currentARR > 50000000) score += 40;
  else if (data.currentARR > 10000000) score += 35;
  else if (data.currentARR > 5000000) score += 30;
  else if (data.currentARR > 1000000) score += 25;
  else if (data.currentARR > 500000) score += 20;
  else if (data.currentARR > 100000) score += 15;

  // Recovery potential scoring (30 points max)
  if (data.totalLeak > 5000000) score += 30;
  else if (data.totalLeak > 1000000) score += 25;
  else if (data.totalLeak > 500000) score += 20;
  else if (data.totalLeak > 100000) score += 15;
  else if (data.totalLeak > 50000) score += 10;

  // Lead volume scoring (20 points max)
  if (data.monthlyLeads > 1000) score += 20;
  else if (data.monthlyLeads > 500) score += 15;
  else if (data.monthlyLeads > 100) score += 10;
  else if (data.monthlyLeads > 50) score += 5;

  // Deal value scoring (10 points max)
  if (data.averageDealValue > 100000) score += 10;
  else if (data.averageDealValue > 50000) score += 8;
  else if (data.averageDealValue > 10000) score += 5;
  else if (data.averageDealValue > 1000) score += 3;

  return Math.min(score, 100);
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