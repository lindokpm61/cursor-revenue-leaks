// Validation helpers for calculation sanity checks

interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  adjustedValue?: number;
}

export const validateCalculationResults = (data: {
  leadResponseLoss: number;
  failedPaymentLoss: number;
  selfServeGap: number;
  processLoss: number;
  currentARR: number;
  recoveryPotential70: number;
  recoveryPotential85: number;
  monthlyLeads?: number;
  averageDealValue?: number;
  monthlyMRR?: number;
}): {
  leadResponse: ValidationResult;
  selfServe: ValidationResult;
  recovery: ValidationResult;
  overall: ValidationResult;
} => {
  // Lead Response Loss Validation with enhanced checks
  const leadResponseValidation: ValidationResult = {
    isValid: true,
    warnings: []
  };
  
  // More conservative bounds for lead response loss (max 30% ARR)
  if (data.leadResponseLoss > data.currentARR * 0.3) {
    leadResponseValidation.isValid = false;
    leadResponseValidation.warnings.push('Lead response loss capped at 30% of ARR for realism');
    leadResponseValidation.adjustedValue = data.currentARR * 0.3;
  }
  
  // Check for unrealistic lead volume vs ARR ratio
  if (data.monthlyLeads && data.averageDealValue && data.currentARR > 0) {
    const annualLeadPotential = data.monthlyLeads * data.averageDealValue * 12;
    if (annualLeadPotential > data.currentARR * 10) {
      leadResponseValidation.warnings.push('Lead potential significantly exceeds current ARR - verify inputs');
    }
  }
  
  // Self-Serve Gap Validation with enhanced bounds
  const selfServeValidation: ValidationResult = {
    isValid: true,
    warnings: []
  };
  
  // More conservative bounds for self-serve gap (max 50% ARR)
  if (data.selfServeGap > data.currentARR * 0.5) {
    selfServeValidation.isValid = false;
    selfServeValidation.warnings.push('Self-serve gap capped at 50% of ARR for realism');
    selfServeValidation.adjustedValue = data.currentARR * 0.5;
  }
  
  // Check for unrealistic conversion assumptions
  if (data.monthlyMRR && data.currentARR > 0) {
    const impliedARRFromMRR = data.monthlyMRR * 12;
    if (Math.abs(impliedARRFromMRR - data.currentARR) > data.currentARR * 0.5) {
      selfServeValidation.warnings.push('MRR and ARR values appear inconsistent - verify inputs');
    }
  }
  
  // Recovery Potential Validation with realistic bounds
  const recoveryValidation: ValidationResult = {
    isValid: true,
    warnings: []
  };
  
  const totalLeak = data.leadResponseLoss + data.failedPaymentLoss + data.selfServeGap + data.processLoss;
  
  // Much more conservative recovery potential checks
  if (data.recoveryPotential70 > data.currentARR * 1.0) {
    recoveryValidation.isValid = false;
    recoveryValidation.warnings.push('70% recovery potential capped at 100% of ARR');
  }
  
  if (data.recoveryPotential85 > data.currentARR * 1.2) {
    recoveryValidation.isValid = false;
    recoveryValidation.warnings.push('85% recovery potential capped at 120% of ARR');
  }
  
  // Total leakage sanity check
  if (totalLeak > data.currentARR * 1.5) {
    recoveryValidation.warnings.push('Total revenue leak exceeds 150% of ARR - calculation adjusted');
  }
  
  // Overall Validation with confidence scoring
  const overallValidation: ValidationResult = {
    isValid: leadResponseValidation.isValid && selfServeValidation.isValid && recoveryValidation.isValid,
    warnings: [
      ...leadResponseValidation.warnings,
      ...selfServeValidation.warnings,
      ...recoveryValidation.warnings
    ]
  };
  
  return {
    leadResponse: leadResponseValidation,
    selfServe: selfServeValidation,
    recovery: recoveryValidation,
    overall: overallValidation
  };
};

export const getCalculationConfidenceLevel = (data: {
  currentARR: number;
  monthlyLeads: number;
  monthlyFreeSignups: number;
  totalLeak: number;
  monthlyMRR?: number;
  averageDealValue?: number;
}): { level: 'high' | 'medium' | 'low'; score: number; factors: string[] } => {
  let score = 0;
  const factors: string[] = [];
  
  // ARR size affects confidence (more conservative scoring)
  if (data.currentARR > 5000000) {
    score += 3;
    factors.push('Large company size increases confidence');
  } else if (data.currentARR > 1000000) {
    score += 2;
    factors.push('Mid-market size provides good confidence');
  } else if (data.currentARR > 100000) {
    score += 1;
    factors.push('SMB size has moderate confidence');
  } else {
    factors.push('Small company size limits confidence');
  }
  
  // Lead volume affects confidence
  if (data.monthlyLeads > 1000) {
    score += 2;
    factors.push('High lead volume increases accuracy');
  } else if (data.monthlyLeads > 200) {
    score += 1;
    factors.push('Moderate lead volume');
  } else {
    factors.push('Low lead volume limits accuracy');
  }
  
  // Signup volume affects confidence
  if (data.monthlyFreeSignups > 2000) {
    score += 2;
    factors.push('High signup volume increases accuracy');
  } else if (data.monthlyFreeSignups > 500) {
    score += 1;
    factors.push('Moderate signup volume');
  } else {
    factors.push('Low signup volume limits accuracy');
  }
  
  // Data consistency checks (more stringent)
  const leakToARRRatio = data.currentARR > 0 ? data.totalLeak / data.currentARR : 0;
  if (leakToARRRatio > 3) {
    score -= 3;
    factors.push('Total leak vs ARR ratio seems very high');
  } else if (leakToARRRatio > 1.5) {
    score -= 2;
    factors.push('Total leak vs ARR ratio seems high');
  } else if (leakToARRRatio > 0.8) {
    score -= 1;
    factors.push('Total leak vs ARR ratio is elevated');
  }
  
  // MRR vs ARR consistency check
  if (data.monthlyMRR && data.currentARR > 0) {
    const impliedARR = data.monthlyMRR * 12;
    const consistency = Math.abs(impliedARR - data.currentARR) / data.currentARR;
    if (consistency > 0.5) {
      score -= 2;
      factors.push('MRR and ARR values appear inconsistent');
    }
  }
  
  // Deal value vs ARR sanity check
  if (data.averageDealValue && data.currentARR > 0) {
    const annualDealPotential = data.monthlyLeads * data.averageDealValue * 12;
    if (annualDealPotential > data.currentARR * 5) {
      score -= 1;
      factors.push('Deal size vs current performance seems optimistic');
    }
  }
  
  // Determine confidence level
  let level: 'high' | 'medium' | 'low';
  if (score >= 6) {
    level = 'high';
  } else if (score >= 3) {
    level = 'medium';
  } else {
    level = 'low';
  }
  
  return { level, score, factors };
};