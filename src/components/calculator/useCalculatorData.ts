import { useState, useMemo } from "react";

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
    const { leadGeneration, selfServeMetrics, operationsData } = data;

    // Ensure all values are numbers and not null/undefined
    const safeNumber = (value: any): number => {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };

    // Debug logging
    console.log('Calculator data:', { leadGeneration, selfServeMetrics, operationsData });

    const monthlyLeads = safeNumber(leadGeneration?.monthlyLeads);
    const averageDealValue = safeNumber(leadGeneration?.averageDealValue);
    const leadResponseTimeHours = safeNumber(leadGeneration?.leadResponseTimeHours);
    const monthlyFreeSignups = safeNumber(selfServeMetrics?.monthlyFreeSignups);
    const freeToPaidConversionRate = safeNumber(selfServeMetrics?.freeToPaidConversionRate);
    const monthlyMRR = safeNumber(selfServeMetrics?.monthlyMRR);
    const failedPaymentRate = safeNumber(operationsData?.failedPaymentRate);
    const manualHoursPerWeek = safeNumber(operationsData?.manualHoursPerWeek);
    const hourlyRate = safeNumber(operationsData?.hourlyRate);

    console.log('Safe numbers:', {
      monthlyLeads,
      averageDealValue,
      leadResponseTimeHours,
      monthlyFreeSignups,
      freeToPaidConversionRate,
      monthlyMRR,
      failedPaymentRate,
      manualHoursPerWeek,
      hourlyRate
    });

    // Lead Response Loss = Monthly Leads × Average Deal × 0.48 × 12
    const leadResponseLoss = monthlyLeads * averageDealValue * 0.48 * 12;

    // Failed Payment Loss = Monthly MRR × (Failed Rate / 100) × 12
    const failedPaymentLoss = monthlyMRR * (failedPaymentRate / 100) * 12;

    // Self-Serve Gap = Free Signups × Monthly MRR per user × Gap percentage × 12
    // Calculate average revenue per converted user (avoid division by zero)
    const avgRevenuePerUser = (monthlyFreeSignups > 0 && freeToPaidConversionRate > 0) 
      ? monthlyMRR / (monthlyFreeSignups * (freeToPaidConversionRate / 100))
      : averageDealValue || 100; // fallback to average deal value or $100

    const conversionGap = Math.max(0, 15 - freeToPaidConversionRate);
    const selfServeGap = monthlyFreeSignups * avgRevenuePerUser * (conversionGap / 100) * 12;

    // Process Loss = Manual Hours × Hourly Rate × 0.25 × 52
    const processLoss = manualHoursPerWeek * hourlyRate * 0.25 * 52;

    const totalLeakage = leadResponseLoss + failedPaymentLoss + selfServeGap + processLoss;
    
    // Recovery potential at 70% and 85%
    const potentialRecovery70 = totalLeakage * 0.7;
    const potentialRecovery85 = totalLeakage * 0.85;

    // Ensure all values are valid numbers
    const validatedCalculations = {
      leadResponseLoss: isFinite(leadResponseLoss) ? leadResponseLoss : 0,
      failedPaymentLoss: isFinite(failedPaymentLoss) ? failedPaymentLoss : 0,
      selfServeGap: isFinite(selfServeGap) ? selfServeGap : 0,
      processLoss: isFinite(processLoss) ? processLoss : 0,
      totalLeakage: isFinite(totalLeakage) ? totalLeakage : 0,
      potentialRecovery70: isFinite(potentialRecovery70) ? potentialRecovery70 : 0,
      potentialRecovery85: isFinite(potentialRecovery85) ? potentialRecovery85 : 0,
    };

    return {
      ...validatedCalculations,
      // Legacy property names for backward compatibility
      totalLeak: validatedCalculations.totalLeakage,
      recoveryPotential70: validatedCalculations.potentialRecovery70,
      recoveryPotential85: validatedCalculations.potentialRecovery85,
    };
  }, [data]);

  return {
    data,
    updateData,
    resetData,
    calculations,
  };
};