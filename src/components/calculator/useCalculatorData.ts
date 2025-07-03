import { useState, useMemo } from "react";

export interface CompanyInfo {
  companyName: string;
  industry: string;
  companySize: string;
  monthlyRevenue: number;
}

export interface LeadMetrics {
  monthlyLeads: number;
  leadQualificationRate: number;
  avgLeadValue: number;
  leadResponseTime: number;
}

export interface ConversionData {
  leadToOpportunityRate: number;
  opportunityToCustomerRate: number;
  avgSalesCycleLength: number;
  avgDealSize: number;
}

export interface OperationsData {
  customerChurnRate: number;
  customerLifetimeValue: number;
  upsellRate: number;
  customerSatisfactionScore: number;
}

export interface CalculatorData {
  companyInfo: CompanyInfo;
  leadMetrics: LeadMetrics;
  conversionData: ConversionData;
  operationsData: OperationsData;
}

export interface Calculations {
  totalLeakage: number;
  leadQualificationLeak: number;
  conversionLeak: number;
  retentionLeak: number;
  potentialRecovery: number;
  monthlyImpact: number;
  annualImpact: number;
}

const initialData: CalculatorData = {
  companyInfo: {
    companyName: "",
    industry: "",
    companySize: "",
    monthlyRevenue: 0,
  },
  leadMetrics: {
    monthlyLeads: 0,
    leadQualificationRate: 0,
    avgLeadValue: 0,
    leadResponseTime: 0,
  },
  conversionData: {
    leadToOpportunityRate: 0,
    opportunityToCustomerRate: 0,
    avgSalesCycleLength: 0,
    avgDealSize: 0,
  },
  operationsData: {
    customerChurnRate: 0,
    customerLifetimeValue: 0,
    upsellRate: 0,
    customerSatisfactionScore: 0,
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

  const calculations = useMemo((): Calculations => {
    const { leadMetrics, conversionData, operationsData } = data;

    // Lead qualification leak
    const qualifiedLeads = leadMetrics.monthlyLeads * (leadMetrics.leadQualificationRate / 100);
    const unqualifiedLeads = leadMetrics.monthlyLeads - qualifiedLeads;
    const leadQualificationLeak = unqualifiedLeads * leadMetrics.avgLeadValue;

    // Conversion leak
    const opportunities = qualifiedLeads * (conversionData.leadToOpportunityRate / 100);
    const lostOpportunities = qualifiedLeads - opportunities;
    const conversionLeak = lostOpportunities * conversionData.avgDealSize;

    // Customer conversion leak
    const customers = opportunities * (conversionData.opportunityToCustomerRate / 100);
    const lostCustomers = opportunities - customers;
    const customerConversionLeak = lostCustomers * conversionData.avgDealSize;

    // Retention leak
    const churnedCustomers = customers * (operationsData.customerChurnRate / 100);
    const retentionLeak = churnedCustomers * operationsData.customerLifetimeValue;

    const totalLeakage = leadQualificationLeak + conversionLeak + customerConversionLeak + retentionLeak;
    
    // Recovery potential based on industry benchmarks
    const potentialRecovery = totalLeakage * 0.3; // Conservative 30% recovery estimate
    const monthlyImpact = potentialRecovery;
    const annualImpact = monthlyImpact * 12;

    return {
      totalLeakage,
      leadQualificationLeak,
      conversionLeak: conversionLeak + customerConversionLeak,
      retentionLeak,
      potentialRecovery,
      monthlyImpact,
      annualImpact,
    };
  }, [data]);

  return {
    data,
    updateData,
    calculations,
  };
};