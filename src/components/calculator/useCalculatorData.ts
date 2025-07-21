
import { useState, useMemo } from "react";
import { UnifiedResultsService, type SubmissionData } from '@/lib/results/UnifiedResultsService';

export interface CompanyInfo {
  companyName: string;
  email: string;
  phone: string;
  industry: string;
  currentARR: number;
}

export interface LeadGeneration {
  monthlyLeads: number;
  averageDealValue: number;
  leadResponseTimeHours: number;
}

export interface SelfServeMetrics {
  monthlyFreeSignups: number;
  freeToPaidConversionRate: number;
  monthlyMRR: number;
}

export interface OperationsData {
  failedPaymentRate: number;
  manualHoursPerWeek: number;
  hourlyRate: number;
}

export interface CalculatorData {
  companyInfo: CompanyInfo;
  leadGeneration: LeadGeneration;
  selfServeMetrics: SelfServeMetrics;
  operationsData: OperationsData;
}

export interface Calculations {
  leadResponseLoss: number;
  failedPaymentLoss: number;
  selfServeGap: number;
  processLoss: number;
  totalLeakage: number;
  potentialRecovery70: number;
  potentialRecovery85: number;
  // Legacy property names for backward compatibility
  totalLeak: number;
  recoveryPotential70: number;
  recoveryPotential85: number;
}

const initialData: CalculatorData = {
  companyInfo: {
    companyName: "",
    email: "",
    phone: "",
    industry: "",
    currentARR: 0,
  },
  leadGeneration: {
    monthlyLeads: 0,
    averageDealValue: 0,
    leadResponseTimeHours: 0,
  },
  selfServeMetrics: {
    monthlyFreeSignups: 0,
    freeToPaidConversionRate: 0,
    monthlyMRR: 0,
  },
  operationsData: {
    failedPaymentRate: 0,
    manualHoursPerWeek: 0,
    hourlyRate: 0,
  },
};

export const useCalculatorData = () => {
  const [data, setData] = useState<CalculatorData>(initialData);

  const updateData = <K extends keyof CalculatorData>(
    section: K,
    updates: Partial<CalculatorData[K]>
  ) => {
    setData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }));
  };

  const resetData = () => {
    setData(initialData);
  };

  const calculations = useMemo((): Calculations => {
    console.log('=== CALCULATOR DATA HOOK DEBUG ===');
    console.log('Raw calculator data:', data);

    // Transform calculator data to SubmissionData format for UnifiedResultsService
    const submissionData: SubmissionData = {
      id: 'temp-id',
      company_name: data.companyInfo.companyName || '',
      contact_email: data.companyInfo.email || '',
      industry: data.companyInfo.industry || '',
      current_arr: data.companyInfo.currentARR || 0,
      monthly_leads: data.leadGeneration.monthlyLeads || 0,
      average_deal_value: data.leadGeneration.averageDealValue || 0,
      lead_response_time: data.leadGeneration.leadResponseTimeHours || 0,
      monthly_free_signups: data.selfServeMetrics.monthlyFreeSignups || 0,
      free_to_paid_conversion: data.selfServeMetrics.freeToPaidConversionRate || 0,
      monthly_mrr: data.selfServeMetrics.monthlyMRR || 0,
      failed_payment_rate: data.operationsData.failedPaymentRate || 0,
      manual_hours: data.operationsData.manualHoursPerWeek || 0,
      hourly_rate: data.operationsData.hourlyRate || 0,
      lead_score: 0,
      user_id: undefined,
      created_at: new Date().toISOString()
    };

    console.log('Transformed submissionData for UnifiedResultsService:', submissionData);

    // Use UnifiedResultsService for calculations
    const unifiedResults = UnifiedResultsService.calculateResults(submissionData);
    
    console.log('UnifiedResultsService results:', unifiedResults);

    // Transform results to match legacy Calculations interface
    const legacyCalculations: Calculations = {
      leadResponseLoss: unifiedResults.leadResponseLoss,
      failedPaymentLoss: unifiedResults.failedPaymentLoss,
      selfServeGap: unifiedResults.selfServeGap,
      processLoss: unifiedResults.processInefficiency,
      totalLeakage: unifiedResults.totalLoss,
      potentialRecovery70: unifiedResults.conservativeRecovery,
      potentialRecovery85: unifiedResults.optimisticRecovery,
      // Legacy property names for backward compatibility
      totalLeak: unifiedResults.totalLoss,
      recoveryPotential70: unifiedResults.conservativeRecovery,
      recoveryPotential85: unifiedResults.optimisticRecovery,
    };

    console.log('Final legacy calculations for backward compatibility:', legacyCalculations);

    return legacyCalculations;
  }, [data]);

  return {
    data,
    updateData,
    resetData,
    calculations,
  };
};
