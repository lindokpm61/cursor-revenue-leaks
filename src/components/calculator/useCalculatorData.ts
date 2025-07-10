import { useState, useMemo } from "react";

export interface CompanyInfo {
  companyName: string;
  email: string;
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
}

const initialData: CalculatorData = {
  companyInfo: {
    companyName: "",
    email: "",
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

    // Self-Serve Gap = Free Signups × Deal Value × ((15 - Conversion%) / 100) × 0.4 × 12
    const selfServeGap = monthlyFreeSignups * averageDealValue * 
      ((15 - freeToPaidConversionRate) / 100) * 0.4 * 12;

    // Process Loss = Manual Hours × Hourly Rate × 0.25 × 52
    const processLoss = manualHoursPerWeek * hourlyRate * 0.25 * 52;

    const totalLeakage = leadResponseLoss + failedPaymentLoss + selfServeGap + processLoss;
    
    // Recovery potential at 70% and 85%
    const potentialRecovery70 = totalLeakage * 0.7;
    const potentialRecovery85 = totalLeakage * 0.85;

    return {
      leadResponseLoss,
      failedPaymentLoss,
      selfServeGap,
      processLoss,
      totalLeakage,
      potentialRecovery70,
      potentialRecovery85,
    };
  }, [data]);

  return {
    data,
    updateData,
    resetData,
    calculations,
  };
};