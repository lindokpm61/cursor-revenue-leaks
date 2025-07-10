// Lead scoring logic for temporary submissions

// Calculate lead score based on calculations and company data
export const calculateLeadScore = (calculations: any, currentARR: number, industry: string): number => {
  let score = 0;
  
  // ARR Points
  const arr = currentARR || 0;
  if (arr >= 5000000) {
    score += 50; // $5M+
  } else if (arr >= 1000000) {
    score += 40; // $1M-5M
  } else if (arr >= 500000) {
    score += 30; // $500K-1M
  } else {
    score += 20; // <$500K
  }
  
  // Leak Impact Points
  const totalLeak = calculations.totalLeakage || 0;
  if (totalLeak >= 1000000) {
    score += 40; // $1M+ leak
  } else if (totalLeak >= 500000) {
    score += 30; // $500K-1M leak
  } else if (totalLeak >= 250000) {
    score += 20; // $250K-500K leak
  } else {
    score += 10; // <$250K leak
  }
  
  // Industry Multiplier
  const ind = industry?.toLowerCase() || '';
  if (ind.includes('technology') || ind.includes('saas') || ind.includes('software')) {
    score += 10; // Technology/SaaS
  } else if (ind.includes('finance') || ind.includes('financial')) {
    score += 8; // Finance
  } else {
    score += 5; // Other
  }
  
  return Math.min(score, 100); // Cap at 100
};