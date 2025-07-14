// Enhanced revenue leak calculations based on 2025 B2B SaaS validation report

export interface DealSizeTier {
  name: string;
  min: number;
  max: number;
  optimalResponseMinutes: number;
}

export interface IndustryBenchmarks {
  conversionRate: number;
  multiplier: number;
  name: string;
}

export interface RecoverySystemType {
  name: string;
  recoveryRate: number;
  retrySuccessRate: number;
}

// Deal size tiers for lead response optimization
export const DEAL_SIZE_TIERS: DealSizeTier[] = [
  { name: 'SMB', min: 0, max: 25000, optimalResponseMinutes: 5 },
  { name: 'Mid-Market', min: 25001, max: 100000, optimalResponseMinutes: 15 },
  { name: 'Enterprise', min: 100001, max: Infinity, optimalResponseMinutes: 60 }
];

// Industry-specific conversion benchmarks (freemium models)
export const INDUSTRY_BENCHMARKS: Record<string, IndustryBenchmarks> = {
  'saas-software': { conversionRate: 4.2, multiplier: 1.5, name: 'SaaS & Software' },
  'technology-it': { conversionRate: 4.2, multiplier: 1.5, name: 'Technology & IT' },
  'financial-services': { conversionRate: 3.8, multiplier: 1.3, name: 'Financial Services' },
  'consulting-professional': { conversionRate: 3.4, multiplier: 1.0, name: 'Professional Services' },
  'healthcare': { conversionRate: 3.2, multiplier: 1.2, name: 'Healthcare' },
  'marketing-advertising': { conversionRate: 3.0, multiplier: 1.1, name: 'Marketing & Advertising' },
  'ecommerce-retail': { conversionRate: 2.8, multiplier: 1.0, name: 'E-commerce & Retail' },
  'manufacturing': { conversionRate: 2.8, multiplier: 1.0, name: 'Manufacturing' },
  'education': { conversionRate: 2.6, multiplier: 1.0, name: 'Education' },
  'other': { conversionRate: 3.4, multiplier: 1.0, name: 'Other' }
};

// Recovery system configurations
export const RECOVERY_SYSTEMS: Record<string, RecoverySystemType> = {
  'basic': { name: 'Basic System', recoveryRate: 0.35, retrySuccessRate: 0.20 },
  'advanced': { name: 'Advanced System', recoveryRate: 0.70, retrySuccessRate: 0.35 },
  'best-in-class': { name: 'Best-in-Class System', recoveryRate: 0.85, retrySuccessRate: 0.50 }
};

// Enhanced lead response time impact calculation (exponential decay)
export const calculateLeadResponseImpact = (responseTimeHours: number, dealValue: number): number => {
  const responseTimeMinutes = responseTimeHours * 60;
  
  // Determine optimal response time based on deal size
  const dealTier = DEAL_SIZE_TIERS.find(tier => dealValue >= tier.min && dealValue <= tier.max) || DEAL_SIZE_TIERS[0];
  
  // Exponential decay formula based on 2025 research
  let effectiveness: number;
  
  if (responseTimeMinutes <= 5) {
    effectiveness = 1.0; // 100% baseline
  } else if (responseTimeMinutes <= 30) {
    effectiveness = 0.85 - ((responseTimeMinutes - 5) / 25) * 0.25; // 85% to 60%
  } else if (responseTimeMinutes <= 60) {
    effectiveness = 0.60 - ((responseTimeMinutes - 30) / 30) * 0.25; // 60% to 35%
  } else if (responseTimeMinutes <= 240) { // 4 hours
    effectiveness = 0.35 - ((responseTimeMinutes - 60) / 180) * 0.20; // 35% to 15%
  } else {
    effectiveness = Math.max(0.05, 0.15 - ((responseTimeMinutes - 240) / 240) * 0.10); // 15% to 5%
  }
  
  // Apply deal size penalty if response time exceeds optimal for tier
  if (responseTimeMinutes > dealTier.optimalResponseMinutes) {
    const penaltyMultiplier = Math.max(0.5, 1 - ((responseTimeMinutes - dealTier.optimalResponseMinutes) / dealTier.optimalResponseMinutes) * 0.3);
    effectiveness *= penaltyMultiplier;
  }
  
  return Math.max(0.05, effectiveness); // Minimum 5% effectiveness
};

// Enhanced failed payment loss calculation with recovery rates
export const calculateFailedPaymentLoss = (
  monthlyMRR: number, 
  failedPaymentRate: number, 
  recoverySystemType: keyof typeof RECOVERY_SYSTEMS = 'basic'
): number => {
  const failedPayments = monthlyMRR * (failedPaymentRate / 100);
  const recoverySystem = RECOVERY_SYSTEMS[recoverySystemType];
  
  // Actual loss = Failed Payments × (1 - Recovery Rate) × (1 - Retry Success Rate)
  const actualLoss = failedPayments * (1 - recoverySystem.recoveryRate) * (1 - recoverySystem.retrySuccessRate);
  
  return actualLoss * 12; // Annual loss
};

// Enhanced self-serve conversion gap calculation with industry benchmarks
export const calculateSelfServeGap = (
  monthlyFreeSignups: number,
  currentConversionRate: number,
  monthlyMRR: number,
  industry: string = 'other'
): number => {
  const benchmark = INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS['other'];
  const benchmarkRate = benchmark.conversionRate;
  
  // Calculate average revenue per converted user
  const avgRevenuePerUser = (monthlyFreeSignups > 0 && currentConversionRate > 0) 
    ? monthlyMRR / (monthlyFreeSignups * (currentConversionRate / 100))
    : 100; // Fallback to $100/month
  
  const conversionGap = Math.max(0, benchmarkRate - currentConversionRate);
  const gapLoss = monthlyFreeSignups * (conversionGap / 100) * avgRevenuePerUser;
  
  return gapLoss * 12; // Annual loss
};

// Enhanced process inefficiency calculation with updated multipliers
export const calculateProcessInefficiency = (
  manualHoursPerWeek: number,
  hourlyRate: number,
  automationPotential: number = 0.70 // 70% automation potential
): number => {
  const annualHours = manualHoursPerWeek * 52;
  const revenueGeneratingPotential = 0.32; // Updated to 32% (vs old 25%)
  
  // Cost of manual work + lost revenue generation opportunity
  const directCost = annualHours * hourlyRate * automationPotential;
  const opportunityCost = annualHours * hourlyRate * revenueGeneratingPotential * automationPotential;
  
  return directCost + opportunityCost;
};

// Enhanced lead scoring with PQL framework
export const calculateEnhancedLeadScore = (data: {
  currentARR: number;
  totalLeak: number;
  monthlyLeads: number;
  averageDealValue: number;
  industry?: string;
  hasProductUsage?: boolean;
  engagementScore?: number;
}): number => {
  let score = 0;
  
  // ARR-based tier scoring (40 points max)
  if (data.currentARR > 10000000) score += 40; // Tier A
  else if (data.currentARR > 1000000) score += 30; // Tier B  
  else if (data.currentARR > 100000) score += 20; // Tier C
  else score += 10; // Tier D
  
  // Recovery potential scoring (30 points max)
  if (data.totalLeak > 5000000) score += 30;
  else if (data.totalLeak > 1000000) score += 25;
  else if (data.totalLeak > 500000) score += 20;
  else if (data.totalLeak > 100000) score += 15;
  else if (data.totalLeak > 50000) score += 10;
  
  // Lead volume scoring (15 points max)
  if (data.monthlyLeads > 1000) score += 15;
  else if (data.monthlyLeads > 500) score += 12;
  else if (data.monthlyLeads > 100) score += 8;
  else if (data.monthlyLeads > 50) score += 5;
  
  // Deal value scoring (10 points max)
  if (data.averageDealValue > 100000) score += 10;
  else if (data.averageDealValue > 50000) score += 8;
  else if (data.averageDealValue > 10000) score += 6;
  else if (data.averageDealValue > 1000) score += 3;
  
  // Industry multiplier (5 points max)
  const industryBenchmark = INDUSTRY_BENCHMARKS[data.industry || 'other'];
  score += Math.round(5 * industryBenchmark.multiplier / 1.5); // Normalize to 5 points max
  
  // Product usage bonus (PQL framework)
  if (data.hasProductUsage) {
    score += 15; // Significant bonus for product-led qualified leads
  }
  
  // Engagement scoring bonus
  if (data.engagementScore && data.engagementScore > 70) {
    score += 10; // High engagement bonus
  } else if (data.engagementScore && data.engagementScore > 40) {
    score += 5; // Medium engagement bonus
  }
  
  return Math.min(score, 100);
};

// Validation functions for recovery potential assumptions
export const validateRecoveryAssumptions = (data: {
  currentARR: number;
  grossRetention?: number;
  netRetention?: number;
  customerSatisfaction?: number;
  hasRevOps?: boolean;
}): { canAchieve70: boolean; canAchieve85: boolean; reasons: string[] } => {
  const reasons: string[] = [];
  let canAchieve70 = true;
  let canAchieve85 = true;
  
  // 70% recovery validation
  if (data.grossRetention && data.grossRetention < 80) {
    canAchieve70 = false;
    reasons.push('Gross retention below 80% threshold');
  }
  
  if (data.customerSatisfaction && data.customerSatisfaction < 7) {
    canAchieve70 = false;
    reasons.push('Customer satisfaction below 7/10 threshold');
  }
  
  if (!data.hasRevOps) {
    canAchieve70 = false;
    reasons.push('RevOps processes not implemented');
  }
  
  // 85% recovery validation (more stringent)
  if (data.netRetention && data.netRetention < 100) {
    canAchieve85 = false;
    reasons.push('Net retention below 100% threshold');
  }
  
  if (data.grossRetention && data.grossRetention < 85) {
    canAchieve85 = false;
    reasons.push('Gross retention below 85% threshold for advanced recovery');
  }
  
  if (data.currentARR < 1000000) {
    canAchieve85 = false;
    reasons.push('Company size may limit advanced recovery capabilities');
  }
  
  return { canAchieve70, canAchieve85, reasons };
};