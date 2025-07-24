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
  if (ind.includes('saas-software') || ind.includes('saas') || ind.includes('software')) {
    score += 12; // SaaS & Software (highest intent)
  } else if (ind.includes('marketing-advertising') || ind.includes('marketing') || ind.includes('advertising')) {
    score += 9; // Marketing & Advertising (high intent)
  } else if (ind.includes('technology-it') || ind.includes('technology') || ind.includes('tech')) {
    score += 8; // Technology & IT
  } else if (ind.includes('financial-services') || ind.includes('finance') || ind.includes('financial')) {
    score += 8; // Financial Services
  } else if (ind.includes('consulting-professional') || ind.includes('consulting') || ind.includes('professional')) {
    score += 7; // Consulting & Professional Services
  } else if (ind.includes('healthcare')) {
    score += 6; // Healthcare
  } else if (ind.includes('ecommerce-retail') || ind.includes('ecommerce') || ind.includes('retail')) {
    score += 6; // E-commerce & Retail
  } else if (ind.includes('manufacturing')) {
    score += 5; // Manufacturing
  } else if (ind.includes('education')) {
    score += 5; // Education
  } else {
    score += 4; // Other
  }
  
  return Math.min(score, 100); // Cap at 100
};