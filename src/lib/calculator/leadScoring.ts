import { CalculatorData, Calculations } from "@/components/calculator/useCalculatorData";

/**
 * Calculates a lead score based on company ARR, revenue leak impact, and industry type
 * Score ranges from 0-100 with higher scores indicating higher value prospects
 */
export const calculateLeadScore = (data: CalculatorData, calculations: Calculations): number => {
  let score = 0;
  
  // ARR Points
  const arr = data.companyInfo.currentARR || 0;
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
  const industry = data.companyInfo.industry?.toLowerCase() || '';
  if (industry.includes('saas-software') || industry.includes('saas') || industry.includes('software')) {
    score += 12; // SaaS & Software (highest intent)
  } else if (industry.includes('marketing-advertising') || industry.includes('marketing') || industry.includes('advertising')) {
    score += 9; // Marketing & Advertising (high intent)
  } else if (industry.includes('technology-it') || industry.includes('technology') || industry.includes('tech')) {
    score += 8; // Technology & IT
  } else if (industry.includes('financial-services') || industry.includes('finance') || industry.includes('financial')) {
    score += 8; // Financial Services
  } else if (industry.includes('consulting-professional') || industry.includes('consulting') || industry.includes('professional')) {
    score += 7; // Consulting & Professional Services
  } else if (industry.includes('healthcare')) {
    score += 6; // Healthcare
  } else if (industry.includes('ecommerce-retail') || industry.includes('ecommerce') || industry.includes('retail')) {
    score += 6; // E-commerce & Retail
  } else if (industry.includes('manufacturing')) {
    score += 5; // Manufacturing
  } else if (industry.includes('education')) {
    score += 5; // Education
  } else {
    score += 4; // Other
  }
  
  return Math.min(score, 100); // Cap at 100
};