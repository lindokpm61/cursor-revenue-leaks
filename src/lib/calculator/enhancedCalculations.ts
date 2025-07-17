// Enhanced revenue leak calculations with realistic recovery potential matrix

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

export interface RecoveryMatrix {
  category: string;
  baseRecoveryRate: number;
  implementationDifficulty: 'low' | 'medium' | 'high';
  timeToValue: number; // months
  dependencies: string[];
  riskFactors: string[];
}

export interface ConfidenceFactors {
  companySize: 'startup' | 'scaleup' | 'enterprise';
  currentMaturity: 'basic' | 'intermediate' | 'advanced';
  resourceAvailable: boolean;
  changeManagementCapability: 'low' | 'medium' | 'high';
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

// Realistic recovery potential matrix by category
export const RECOVERY_MATRIX: Record<string, RecoveryMatrix> = {
  'leadResponse': {
    category: 'Lead Response',
    baseRecoveryRate: 0.55, // 55% base recovery - easier to implement
    implementationDifficulty: 'low',
    timeToValue: 2, // 2 months
    dependencies: ['CRM implementation', 'Lead routing automation'],
    riskFactors: ['Team adoption', 'Process complexity']
  },
  'selfServe': {
    category: 'Self-Serve Optimization',
    baseRecoveryRate: 0.35, // 35% base recovery - requires significant UX changes
    implementationDifficulty: 'high',
    timeToValue: 6, // 6 months
    dependencies: ['Product development', 'UX redesign', 'A/B testing infrastructure'],
    riskFactors: ['Product-market fit', 'User adoption', 'Technical complexity']
  },
  'processAutomation': {
    category: 'Process Automation',
    baseRecoveryRate: 0.60, // 60% base recovery - depends on automation complexity
    implementationDifficulty: 'medium',
    timeToValue: 4, // 4 months
    dependencies: ['Workflow mapping', 'Tool integration', 'Training'],
    riskFactors: ['Change management', 'System integration', 'User training']
  },
  'paymentRecovery': {
    category: 'Payment Recovery',
    baseRecoveryRate: 0.70, // 70% base recovery - technical solution with measurable results
    implementationDifficulty: 'low',
    timeToValue: 1, // 1 month
    dependencies: ['Payment processor integration', 'Retry logic'],
    riskFactors: ['Customer experience', 'Integration complexity']
  }
};

// Implementation reality factors (ramp-up curves)
export const IMPLEMENTATION_CURVES = {
  year1: 0.30, // 30% of potential achieved in year 1
  year2: 0.75, // 75% of potential achieved in year 2  
  year3: 1.00  // 100% of potential achieved in year 3
};

// Company size impact on recovery capability
export const COMPANY_SIZE_MULTIPLIERS = {
  startup: 0.75,    // 75% - limited resources, faster decision making
  scaleup: 0.90,    // 90% - good balance of resources and agility
  enterprise: 1.00  // 100% - full resources, slower implementation
};

// Change management capability impact
export const CHANGE_MANAGEMENT_MULTIPLIERS = {
  low: 0.70,    // 70% - poor change management reduces success
  medium: 0.85, // 85% - adequate change management
  high: 1.00    // 100% - excellent change management
};

// Enhanced lead response time impact calculation (realistic decay model with bounds)
export const calculateLeadResponseImpact = (responseTimeHours: number, dealValue: number): number => {
  const responseTimeMinutes = responseTimeHours * 60;
  
  // Input validation and bounds
  if (responseTimeHours <= 0) return 1.0; // Perfect response
  if (responseTimeHours > 168) return 0.4; // Cap at 1 week max penalty
  
  // Determine optimal response time based on deal size
  const dealTier = DEAL_SIZE_TIERS.find(tier => dealValue >= tier.min && dealValue <= tier.max) || DEAL_SIZE_TIERS[0];
  
  // Much more conservative effectiveness decay
  let effectiveness: number;
  
  if (responseTimeMinutes <= 5) {
    effectiveness = 1.0; // 100% baseline
  } else if (responseTimeMinutes <= 30) {
    effectiveness = 0.98 - ((responseTimeMinutes - 5) / 25) * 0.08; // 98% to 90%
  } else if (responseTimeMinutes <= 60) {
    effectiveness = 0.90 - ((responseTimeMinutes - 30) / 30) * 0.10; // 90% to 80%
  } else if (responseTimeMinutes <= 240) { // 4 hours
    effectiveness = 0.80 - ((responseTimeMinutes - 60) / 180) * 0.20; // 80% to 60%
  } else {
    effectiveness = Math.max(0.40, 0.60 - ((responseTimeMinutes - 240) / 960) * 0.20); // 60% to 40%
  }
  
  // Apply much smaller penalty for deal size mismatch
  if (responseTimeMinutes > dealTier.optimalResponseMinutes) {
    const penaltyMultiplier = Math.max(0.95, 1 - ((responseTimeMinutes - dealTier.optimalResponseMinutes) / dealTier.optimalResponseMinutes) * 0.05);
    effectiveness *= penaltyMultiplier;
  }
  
  return Math.max(0.40, effectiveness); // Minimum 40% effectiveness (more realistic)
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

// Enhanced self-serve conversion gap calculation with realistic bounds
export const calculateSelfServeGap = (
  monthlyFreeSignups: number,
  currentConversionRate: number,
  monthlyMRR: number,
  industry: string = 'other'
): number => {
  // Input validation
  if (monthlyFreeSignups <= 0 || monthlyMRR <= 0) return 0;
  if (currentConversionRate >= 15) return 0; // Already at very high conversion
  
  const benchmark = INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS['other'];
  const benchmarkRate = Math.min(benchmark.conversionRate, 8.0); // Cap benchmark at 8%
  
  // Calculate average revenue per converted user with strict bounds
  let avgRevenuePerUser: number;
  if (currentConversionRate > 0) {
    const currentConversions = monthlyFreeSignups * (currentConversionRate / 100);
    avgRevenuePerUser = currentConversions > 0 ? monthlyMRR / currentConversions : 100;
    // Stricter ARPU bounds ($20-$200/month for freemium)
    avgRevenuePerUser = Math.min(Math.max(avgRevenuePerUser, 20), 200);
  } else {
    avgRevenuePerUser = 50; // Conservative fallback
  }
  
  // Conservative conversion gap - only count realistic improvements
  const conversionGap = Math.max(0, Math.min(benchmarkRate - currentConversionRate, 5)); // Max 5% improvement
  const monthlyGapLoss = monthlyFreeSignups * (conversionGap / 100) * avgRevenuePerUser;
  
  // Cap the annual loss at very conservative levels (max 12x monthly MRR)
  const maxReasonableLoss = monthlyMRR * 12;
  return Math.min(monthlyGapLoss * 12, maxReasonableLoss);
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

// Calculate realistic recovery potential with implementation factors
export const calculateRealisticRecoveryPotential = (
  losses: {
    leadResponse: number;
    selfServe: number;
    processAutomation: number;
    paymentRecovery: number;
  },
  confidenceFactors: ConfidenceFactors,
  scenario: 'conservative' | 'optimistic' = 'conservative'
): {
  totalRecovery: number;
  categoryRecovery: Record<string, number>;
  implementationFactors: Record<string, number>;
  riskAdjustments: Record<string, number>;
} => {
  const scenarioMultiplier = scenario === 'conservative' ? 0.85 : 1.0;
  const sizeMultiplier = COMPANY_SIZE_MULTIPLIERS[confidenceFactors.companySize];
  const changeMultiplier = CHANGE_MANAGEMENT_MULTIPLIERS[confidenceFactors.changeManagementCapability];
  
  // Apply diminishing returns for multiple simultaneous initiatives
  const simultaneousInitiativesPenalty = 0.90; // 10% reduction for overlap
  
  const categoryRecovery: Record<string, number> = {};
  const implementationFactors: Record<string, number> = {};
  const riskAdjustments: Record<string, number> = {};
  
  // Calculate category-specific recovery with realistic factors
  Object.entries(losses).forEach(([category, loss]) => {
    const matrix = RECOVERY_MATRIX[category];
    if (!matrix || loss === 0) {
      categoryRecovery[category] = 0;
      implementationFactors[category] = 0;
      riskAdjustments[category] = 0;
      return;
    }
    
    // Base recovery rate from matrix
    let recoveryRate = matrix.baseRecoveryRate;
    
    // Apply confidence adjustments
    recoveryRate *= sizeMultiplier;
    recoveryRate *= changeMultiplier;
    recoveryRate *= scenarioMultiplier;
    
    // Apply implementation difficulty penalty
    const difficultyPenalty = {
      'low': 1.0,
      'medium': 0.90,
      'high': 0.75
    }[matrix.implementationDifficulty];
    recoveryRate *= difficultyPenalty;
    
    // Apply resource availability factor
    if (!confidenceFactors.resourceAvailable) {
      recoveryRate *= 0.80; // 20% penalty for limited resources
    }
    
    // Apply maturity factor
    const maturityMultiplier = {
      'basic': 0.75,
      'intermediate': 0.90,
      'advanced': 1.00
    }[confidenceFactors.currentMaturity];
    recoveryRate *= maturityMultiplier;
    
    // Apply simultaneous initiatives penalty
    recoveryRate *= simultaneousInitiativesPenalty;
    
    // Cap recovery rate at realistic maximums
    const maxRecoveryRate = scenario === 'conservative' ? 0.65 : 0.80;
    recoveryRate = Math.min(recoveryRate, maxRecoveryRate);
    
    categoryRecovery[category] = loss * recoveryRate;
    implementationFactors[category] = recoveryRate;
    riskAdjustments[category] = 1 - recoveryRate;
  });
  
  const totalRecovery = Object.values(categoryRecovery).reduce((sum, recovery) => sum + recovery, 0);
  
  return {
    totalRecovery,
    categoryRecovery,
    implementationFactors,
    riskAdjustments
  };
};

// Calculate recovery ranges for better user understanding
export const calculateRecoveryRanges = (
  losses: {
    leadResponse: number;
    selfServe: number;
    processAutomation: number;
    paymentRecovery: number;
  },
  confidenceFactors: ConfidenceFactors
): {
  conservative: ReturnType<typeof calculateRealisticRecoveryPotential>;
  optimistic: ReturnType<typeof calculateRealisticRecoveryPotential>;
  bestCase: ReturnType<typeof calculateRealisticRecoveryPotential>;
} => {
  const conservative = calculateRealisticRecoveryPotential(losses, confidenceFactors, 'conservative');
  const optimistic = calculateRealisticRecoveryPotential(losses, confidenceFactors, 'optimistic');
  
  // Best case scenario with ideal conditions
  const idealFactors: ConfidenceFactors = {
    ...confidenceFactors,
    resourceAvailable: true,
    changeManagementCapability: 'high',
    currentMaturity: 'advanced'
  };
  const bestCase = calculateRealisticRecoveryPotential(losses, idealFactors, 'optimistic');
  
  return { conservative, optimistic, bestCase };
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
  
  // Conservative recovery validation (realistic 50-60% range)
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
  
  // Optimistic recovery validation (realistic 60-70% range)
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