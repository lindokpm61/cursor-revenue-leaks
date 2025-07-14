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
}): {
  leadResponse: ValidationResult;
  selfServe: ValidationResult;
  recovery: ValidationResult;
  overall: ValidationResult;
} => {
  const warnings: string[] = [];
  
  // Lead Response Loss Validation
  const leadResponseValidation: ValidationResult = {
    isValid: true,
    warnings: []
  };
  
  // Check if lead response loss exceeds reasonable bounds (max 2x ARR)
  if (data.leadResponseLoss > data.currentARR * 2) {
    leadResponseValidation.isValid = false;
    leadResponseValidation.warnings.push('Lead response loss appears unrealistically high');
    leadResponseValidation.adjustedValue = data.currentARR * 2;
  }
  
  // Self-Serve Gap Validation
  const selfServeValidation: ValidationResult = {
    isValid: true,
    warnings: []
  };
  
  // Check if self-serve gap exceeds reasonable bounds (max 5x ARR)
  if (data.selfServeGap > data.currentARR * 5) {
    selfServeValidation.isValid = false;
    selfServeValidation.warnings.push('Self-serve gap calculation may be overestimated');
    selfServeValidation.adjustedValue = data.currentARR * 5;
  }
  
  // Recovery Potential Validation
  const recoveryValidation: ValidationResult = {
    isValid: true,
    warnings: []
  };
  
  const totalLeak = data.leadResponseLoss + data.failedPaymentLoss + data.selfServeGap + data.processLoss;
  
  // Check if recovery potential is realistic
  if (data.recoveryPotential70 > data.currentARR * 10) {
    recoveryValidation.isValid = false;
    recoveryValidation.warnings.push('Recovery potential exceeds 10x current ARR - may indicate calculation issues');
  }
  
  if (data.recoveryPotential85 > totalLeak * 0.85) {
    recoveryValidation.warnings.push('85% recovery scenario assumes best-in-class execution');
  }
  
  // Overall Validation
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
}): 'high' | 'medium' | 'low' => {
  let score = 0;
  
  // ARR size affects confidence
  if (data.currentARR > 1000000) score += 2;
  else if (data.currentARR > 100000) score += 1;
  
  // Lead volume affects confidence
  if (data.monthlyLeads > 500) score += 2;
  else if (data.monthlyLeads > 100) score += 1;
  
  // Signup volume affects confidence
  if (data.monthlyFreeSignups > 1000) score += 2;
  else if (data.monthlyFreeSignups > 100) score += 1;
  
  // Sanity check - total leak vs ARR
  const leakToARRRatio = data.totalLeak / data.currentARR;
  if (leakToARRRatio > 20) score -= 2; // Very suspicious
  else if (leakToARRRatio > 10) score -= 1; // Questionable
  
  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
};