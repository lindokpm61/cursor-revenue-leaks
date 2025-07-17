// Industry-specific benchmarks and smart defaults based on real SaaS data

export interface IndustryBenchmarks {
  // Lead Generation
  monthlyLeads: number;
  averageDealValue: number;
  leadResponseTimeHours: number;
  
  // Self-Serve Metrics  
  monthlyFreeSignups: number;
  freeToPaidConversionRate: number;
  monthlyMRR: number;
  
  // Operations
  failedPaymentRate: number;
  manualHours: number;
  hourlyRate: number;
}

export interface BestInClassBenchmarks {
  // Best-in-class performance targets (top 5% performers)
  leadResponseTimeMinutes: number; // <15 min for enterprise, <5 min for SMB
  freeToPaidConversionRateMax: number; // 25-40% for top performers
  failedPaymentRateMin: number; // <1% for best-in-class
  manualHoursMin: number; // <10 hours/week for highly automated
}

export const industryDefaults: Record<string, IndustryBenchmarks> = {
  "saas-software": {
    monthlyLeads: 850,
    averageDealValue: 12000,
    leadResponseTimeHours: 4,
    monthlyFreeSignups: 2400,
    freeToPaidConversionRate: 12,
    monthlyMRR: 85000,
    failedPaymentRate: 4.2,
    manualHours: 32,
    hourlyRate: 85,
  },
  "technology-it": {
    monthlyLeads: 650,
    averageDealValue: 18000,
    leadResponseTimeHours: 6,
    monthlyFreeSignups: 1800,
    freeToPaidConversionRate: 8,
    monthlyMRR: 120000,
    failedPaymentRate: 3.8,
    manualHours: 28,
    hourlyRate: 95,
  },
  "marketing-advertising": {
    monthlyLeads: 1200,
    averageDealValue: 6500,
    leadResponseTimeHours: 2,
    monthlyFreeSignups: 3500,
    freeToPaidConversionRate: 15,
    monthlyMRR: 45000,
    failedPaymentRate: 5.1,
    manualHours: 40,
    hourlyRate: 75,
  },
  "financial-services": {
    monthlyLeads: 420,
    averageDealValue: 35000,
    leadResponseTimeHours: 8,
    monthlyFreeSignups: 800,
    freeToPaidConversionRate: 6,
    monthlyMRR: 180000,
    failedPaymentRate: 2.8,
    manualHours: 25,
    hourlyRate: 125,
  },
  "consulting-professional": {
    monthlyLeads: 320,
    averageDealValue: 45000,
    leadResponseTimeHours: 12,
    monthlyFreeSignups: 600,
    freeToPaidConversionRate: 5,
    monthlyMRR: 220000,
    failedPaymentRate: 3.2,
    manualHours: 35,
    hourlyRate: 150,
  },
  "ecommerce-retail": {
    monthlyLeads: 2800,
    averageDealValue: 2500,
    leadResponseTimeHours: 1,
    monthlyFreeSignups: 8500,
    freeToPaidConversionRate: 18,
    monthlyMRR: 28000,
    failedPaymentRate: 6.8,
    manualHours: 45,
    hourlyRate: 55,
  },
  "healthcare": {
    monthlyLeads: 280,
    averageDealValue: 28000,
    leadResponseTimeHours: 24,
    monthlyFreeSignups: 450,
    freeToPaidConversionRate: 4,
    monthlyMRR: 150000,
    failedPaymentRate: 2.1,
    manualHours: 30,
    hourlyRate: 110,
  },
  "manufacturing": {
    monthlyLeads: 180,
    averageDealValue: 85000,
    leadResponseTimeHours: 48,
    monthlyFreeSignups: 200,
    freeToPaidConversionRate: 3,
    monthlyMRR: 380000,
    failedPaymentRate: 1.8,
    manualHours: 22,
    hourlyRate: 95,
  },
  "education": {
    monthlyLeads: 950,
    averageDealValue: 8500,
    leadResponseTimeHours: 6,
    monthlyFreeSignups: 4200,
    freeToPaidConversionRate: 14,
    monthlyMRR: 65000,
    failedPaymentRate: 4.5,
    manualHours: 38,
    hourlyRate: 65,
  },
  "other": {
    monthlyLeads: 600,
    averageDealValue: 15000,
    leadResponseTimeHours: 6,
    monthlyFreeSignups: 1500,
    freeToPaidConversionRate: 10,
    monthlyMRR: 75000,
    failedPaymentRate: 4.0,
    manualHours: 35,
    hourlyRate: 85,
  },
};

// Best-in-class performance targets by industry
export const bestInClassTargets: Record<string, BestInClassBenchmarks> = {
  "saas-software": {
    leadResponseTimeMinutes: 15, // <15 minutes
    freeToPaidConversionRateMax: 30, // 30%+
    failedPaymentRateMin: 0.8, // <1%
    manualHoursMin: 8, // <10 hours/week
  },
  "technology-it": {
    leadResponseTimeMinutes: 30,
    freeToPaidConversionRateMax: 25,
    failedPaymentRateMin: 0.5,
    manualHoursMin: 6,
  },
  "marketing-advertising": {
    leadResponseTimeMinutes: 10,
    freeToPaidConversionRateMax: 35,
    failedPaymentRateMin: 1.2,
    manualHoursMin: 12,
  },
  "financial-services": {
    leadResponseTimeMinutes: 60,
    freeToPaidConversionRateMax: 20,
    failedPaymentRateMin: 0.3,
    manualHoursMin: 5,
  },
  "consulting-professional": {
    leadResponseTimeMinutes: 120,
    freeToPaidConversionRateMax: 18,
    failedPaymentRateMin: 0.4,
    manualHoursMin: 8,
  },
  "ecommerce-retail": {
    leadResponseTimeMinutes: 5,
    freeToPaidConversionRateMax: 40,
    failedPaymentRateMin: 1.5,
    manualHoursMin: 15,
  },
  "healthcare": {
    leadResponseTimeMinutes: 240,
    freeToPaidConversionRateMax: 15,
    failedPaymentRateMin: 0.2,
    manualHoursMin: 6,
  },
  "manufacturing": {
    leadResponseTimeMinutes: 480,
    freeToPaidConversionRateMax: 12,
    failedPaymentRateMin: 0.1,
    manualHoursMin: 4,
  },
  "education": {
    leadResponseTimeMinutes: 20,
    freeToPaidConversionRateMax: 28,
    failedPaymentRateMin: 1.0,
    manualHoursMin: 10,
  },
  "other": {
    leadResponseTimeMinutes: 30,
    freeToPaidConversionRateMax: 25,
    failedPaymentRateMin: 0.8,
    manualHoursMin: 8,
  },
};

// Benchmark labels for UI display
export const benchmarkLabels = {
  leadResponseTimeHours: "Industry Avg",
  freeToPaidConversionRate: "15% Target",
  failedPaymentRate: "3% Target", 
  monthlyLeads: "Industry Avg",
  averageDealValue: "Industry Avg",
  monthlyFreeSignups: "Industry Avg",
  monthlyMRR: "Industry Avg",
  manualHours: "Efficiency Target",
  hourlyRate: "Market Rate",
};

// Get industry-specific validation rules
export const getValidationRules = (field: keyof IndustryBenchmarks, industry?: string) => {
  const defaults = industry ? industryDefaults[industry] : industryDefaults.other;
  const baseline = defaults[field];
  
  switch (field) {
    case "leadResponseTimeHours":
      return {
        min: 0,
        max: 168, // 1 week max
        message: "Response time should be between 0-168 hours"
      };
    case "freeToPaidConversionRate":
      return {
        min: 0,
        max: 100,
        message: "Conversion rate should be between 0-100%"
      };
    case "failedPaymentRate":
      return {
        min: 0,
        max: 50,
        message: "Failed payment rate should be between 0-50%"
      };
    case "monthlyLeads":
      return {
        min: 1,
        max: 50000,
        message: "Monthly leads should be between 1-50,000"
      };
    case "averageDealValue":
      return {
        min: 100,
        max: 10000000,
        message: "Deal value should be between $100-$10M"
      };
    case "monthlyFreeSignups":
      return {
        min: 0,
        max: 100000,
        message: "Monthly signups should be between 0-100,000"
      };
    case "monthlyMRR":
      return {
        min: 0,
        max: 50000000,
        message: "Monthly MRR should be between $0-$50M"
      };
    case "manualHours":
      return {
        min: 0,
        max: 80,
        message: "Manual hours should be between 0-80 per week"
      };
    case "hourlyRate":
      return {
        min: 15,
        max: 500,
        message: "Hourly rate should be between $15-$500"
      };
    default:
      return { min: 0 };
  }
};

// Get benchmark comparison data
export const getBenchmark = (field: keyof IndustryBenchmarks, industry?: string) => {
  const defaults = industry ? industryDefaults[industry] : industryDefaults.other;
  const value = defaults[field];
  const label = benchmarkLabels[field];
  
  // Determine if higher or lower values are better
  const lowerIsBetter = ["leadResponseTimeHours", "failedPaymentRate", "manualHours"];
  const type = lowerIsBetter.includes(field) ? "warning" : "good";
  
  return {
    value,
    label,
    type: type as "good" | "warning" | "danger"
  };
};

// Format values for display
export const formatValue = (field: keyof IndustryBenchmarks, value: number): string => {
  switch (field) {
    case "averageDealValue":
    case "monthlyMRR":
      return `$${value.toLocaleString()}`;
    case "freeToPaidConversionRate":
    case "failedPaymentRate":
      return `${value}%`;
    case "leadResponseTimeHours":
      return value === 1 ? "1 hour" : `${value} hours`;
    case "hourlyRate":
      return `$${value}/hr`;
    case "manualHours":
      return `${value} hrs/week`;
    default:
      return value.toLocaleString();
  }
};