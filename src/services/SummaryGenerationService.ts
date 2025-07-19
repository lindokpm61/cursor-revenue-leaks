import { type CalculatorData, type Calculations } from '@/components/calculator/useCalculatorData';

export interface ExecutiveSummaryData {
  companyName: string;
  currentARR: number;
  totalRevenueLeak: number;
  leakagePercentage: number;
  recoveryPotential70: number;
  recoveryPotential85: number;
  roiPotential: number;
  leadResponseLoss: number;
  failedPaymentLoss: number;
  processInefficiency: number;
  selfServeGap: number;
  keyInsights: string[];
  priorityActions: string[];
  implementationTimeframe: string;
  generatedAt: string;
}

export class SummaryGenerationService {
  static generateExecutiveSummary(
    data: CalculatorData,
    calculations: Calculations
  ): ExecutiveSummaryData {
    const currentARR = data.companyInfo?.currentARR || 0;
    const totalLeak = calculations.totalLeak || 0;
    const leakagePercentage = currentARR > 0 ? (totalLeak / currentARR) * 100 : 0;
    
    // Generate key insights based on data
    const insights = this.generateKeyInsights(data, calculations);
    const actions = this.generatePriorityActions(calculations);
    const timeframe = this.getImplementationTimeframe(totalLeak);

    return {
      companyName: data.companyInfo?.companyName || 'Company',
      currentARR,
      totalRevenueLeak: totalLeak,
      leakagePercentage,
      recoveryPotential70: calculations.recoveryPotential70 || 0,
      recoveryPotential85: calculations.recoveryPotential85 || 0,
      roiPotential: this.calculateROI(calculations),
      leadResponseLoss: calculations.leadResponseLoss || 0,
      failedPaymentLoss: calculations.failedPaymentLoss || 0,
      processInefficiency: calculations.processLoss || 0,
      selfServeGap: calculations.selfServeGap || 0,
      keyInsights: insights,
      priorityActions: actions,
      implementationTimeframe: timeframe,
      generatedAt: new Date().toISOString(),
    };
  }

  private static generateKeyInsights(data: CalculatorData, calculations: Calculations): string[] {
    const insights: string[] = [];
    const currentARR = data.companyInfo?.currentARR || 0;
    const totalLeak = calculations.totalLeak || 0;
    
    if (totalLeak > currentARR * 0.1) {
      insights.push(`Revenue leakage represents ${((totalLeak / currentARR) * 100).toFixed(1)}% of current ARR`);
    }
    
    if (calculations.leadResponseLoss && calculations.leadResponseLoss > totalLeak * 0.4) {
      insights.push('Lead response delays are the primary source of revenue loss');
    }
    
    if (calculations.failedPaymentLoss && calculations.failedPaymentLoss > totalLeak * 0.2) {
      insights.push('Payment failures represent a significant opportunity for automation');
    }
    
    if (calculations.processLoss && calculations.processLoss > totalLeak * 0.3) {
      insights.push('Process automation could significantly reduce operational costs');
    }

    return insights;
  }

  private static generatePriorityActions(calculations: Calculations): string[] {
    const actions: string[] = [];
    const totalLeak = calculations.totalLeak || 0;
    
    if (calculations.leadResponseLoss && calculations.leadResponseLoss > totalLeak * 0.3) {
      actions.push('Implement automated lead response system');
    }
    
    if (calculations.failedPaymentLoss && calculations.failedPaymentLoss > 0) {
      actions.push('Deploy payment failure recovery automation');
    }
    
    if (calculations.processLoss && calculations.processLoss > totalLeak * 0.2) {
      actions.push('Automate manual processes to reduce operational overhead');
    }
    
    if (calculations.selfServeGap && calculations.selfServeGap > 0) {
      actions.push('Enhance self-service capabilities');
    }

    return actions;
  }

  private static getImplementationTimeframe(totalLeak: number): string {
    if (totalLeak > 500000) return '3-6 months for maximum impact';
    if (totalLeak > 100000) return '2-4 months for significant improvement';
    return '1-3 months for targeted optimization';
  }

  private static calculateROI(calculations: Calculations): number {
    const recovery = calculations.recoveryPotential70 || 0;
    const implementationCost = recovery * 0.15; // Assume 15% implementation cost
    return implementationCost > 0 ? (recovery / implementationCost) * 100 : 0;
  }
}