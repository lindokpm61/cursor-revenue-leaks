import { supabase } from "@/integrations/supabase/client";
import { triggerN8NWorkflow } from "./coreDataCapture";

// Email sequence performance analytics
interface EmailSequenceAnalytics {
  sequence_type: string;
  total_sent: number;
  total_opens: number;
  total_clicks: number;
  total_conversions: number;
  total_revenue: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  week: string;
}

// Abandonment analytics interface
interface AbandonmentAnalytics {
  current_step: number;
  total_at_step: number;
  progressed_from_step: number;
  converted_from_step: number;
  abandonment_rate: number;
  conversion_rate: number;
  avg_recovery_potential: number;
  high_value_count: number;
}

// Get email sequence analytics from database view
export const getEmailSequenceAnalytics = async (): Promise<EmailSequenceAnalytics[]> => {
  try {
    const { data, error } = await supabase
      .from('email_sequence_analytics')
      .select('*')
      .order('week', { ascending: false })
      .limit(8); // Last 8 weeks

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching email sequence analytics:', error);
    return [];
  }
};

// Get abandonment analytics from database view
export const getAbandonmentAnalytics = async (): Promise<AbandonmentAnalytics[]> => {
  try {
    const { data, error } = await supabase
      .from('abandonment_analytics')
      .select('*')
      .order('current_step');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching abandonment analytics:', error);
    return [];
  }
};

// Track email sequence performance events
export const trackEmailSequencePerformance = async () => {
  try {
    const sequences = await getEmailSequenceAnalytics();
    
    // Transform data for analytics reporting
    const analytics = sequences.map(sequence => ({
      sequence_type: sequence.sequence_type,
      total_sent: sequence.total_sent,
      open_rate: sequence.open_rate,
      click_rate: sequence.click_rate,
      conversion_rate: sequence.conversion_rate,
      revenue_attributed: sequence.total_revenue,
      week: sequence.week,
      
      // Performance scoring
      performance_score: calculatePerformanceScore(sequence),
      
      // Optimization flags
      needs_optimization: sequence.open_rate < 20 || sequence.click_rate < 2,
      high_performer: sequence.conversion_rate > 5
    }));
    
    // Send analytics to N8N for reporting
    await triggerN8NWorkflow('analytics-reporting', {
      report_type: 'email_sequence_performance',
      data: analytics,
      period: 'weekly',
      summary: {
        total_sequences: analytics.length,
        avg_open_rate: analytics.reduce((sum, a) => sum + a.open_rate, 0) / analytics.length,
        avg_click_rate: analytics.reduce((sum, a) => sum + a.click_rate, 0) / analytics.length,
        avg_conversion_rate: analytics.reduce((sum, a) => sum + a.conversion_rate, 0) / analytics.length,
        total_revenue: analytics.reduce((sum, a) => sum + a.revenue_attributed, 0),
        high_performers: analytics.filter(a => a.high_performer).length,
        need_optimization: analytics.filter(a => a.needs_optimization).length
      }
    });
    
    console.log('Email sequence performance analytics sent to N8N');
    return analytics;
  } catch (error) {
    console.error('Error tracking email sequence performance:', error);
    return [];
  }
};

// Calculate performance score for email sequences
const calculatePerformanceScore = (sequence: EmailSequenceAnalytics): number => {
  let score = 0;
  
  // Open rate scoring (40% weight)
  if (sequence.open_rate >= 30) score += 40;
  else if (sequence.open_rate >= 20) score += 30;
  else if (sequence.open_rate >= 15) score += 20;
  else score += 10;
  
  // Click rate scoring (30% weight)
  if (sequence.click_rate >= 5) score += 30;
  else if (sequence.click_rate >= 3) score += 25;
  else if (sequence.click_rate >= 2) score += 15;
  else score += 5;
  
  // Conversion rate scoring (30% weight)
  if (sequence.conversion_rate >= 10) score += 30;
  else if (sequence.conversion_rate >= 5) score += 25;
  else if (sequence.conversion_rate >= 2) score += 15;
  else score += 5;
  
  return score;
};

// Generate optimization recommendations based on abandonment data
const generateOptimizationRecommendations = (abandonmentData: AbandonmentAnalytics[]): string[] => {
  const recommendations: string[] = [];
  
  abandonmentData.forEach(step => {
    if (step.abandonment_rate > 50) {
      recommendations.push(`Step ${step.current_step}: High abandonment rate (${step.abandonment_rate}%) - Review form complexity and messaging`);
    }
    
    if (step.conversion_rate < 5 && step.avg_recovery_potential > 500000) {
      recommendations.push(`Step ${step.current_step}: Low conversion despite high value prospects - Implement urgency tactics`);
    }
    
    if (step.high_value_count > 5 && step.conversion_rate < 10) {
      recommendations.push(`Step ${step.current_step}: ${step.high_value_count} high-value prospects not converting - Consider personal outreach`);
    }
  });
  
  // General recommendations
  if (abandonmentData.some(s => s.abandonment_rate > 60)) {
    recommendations.push('Overall: Consider implementing exit-intent popups for highest abandonment steps');
  }
  
  if (abandonmentData.every(s => s.conversion_rate < 5)) {
    recommendations.push('Overall: Low conversion across all steps - Review value proposition and incentives');
  }
  
  return recommendations;
};

// Analyze abandonment patterns and generate insights
export const analyzeAbandonmentPatterns = async () => {
  try {
    const abandonmentData = await getAbandonmentAnalytics();
    
    // Calculate advanced metrics
    const totalUsers = abandonmentData.reduce((sum, step) => sum + step.total_at_step, 0);
    const totalConverted = abandonmentData.reduce((sum, step) => sum + step.converted_from_step, 0);
    const totalRevenuePotential = abandonmentData.reduce((sum, step) => 
      sum + (step.avg_recovery_potential * step.total_at_step), 0);
    const lostRevenuePotential = abandonmentData.reduce((sum, step) => 
      sum + (step.avg_recovery_potential * (step.total_at_step - step.converted_from_step)), 0);
    
    // Identify optimization opportunities
    const insights = {
      overview: {
        total_users: totalUsers,
        overall_conversion_rate: totalUsers > 0 ? (totalConverted / totalUsers * 100).toFixed(2) : 0,
        total_revenue_potential: totalRevenuePotential,
        lost_revenue_potential: lostRevenuePotential,
        recovery_opportunity: lostRevenuePotential * 0.3 // Assume 30% recovery potential
      },
      step_analysis: abandonmentData.map(step => ({
        step: step.current_step,
        abandonment_rate: step.abandonment_rate,
        conversion_rate: step.conversion_rate,
        avg_value: step.avg_recovery_potential,
        high_value_prospects: step.high_value_count,
        priority_score: calculateStepPriorityScore(step)
      })),
      optimization_recommendations: generateOptimizationRecommendations(abandonmentData),
      high_priority_actions: identifyHighPriorityActions(abandonmentData)
    };
    
    // Share insights with team through N8N
    await triggerN8NWorkflow('analytics-reporting', {
      report_type: 'abandonment_analysis',
      insights: insights,
      generated_at: new Date().toISOString()
    });
    
    console.log('Abandonment analysis insights sent to N8N');
    return insights;
  } catch (error) {
    console.error('Error analyzing abandonment patterns:', error);
    return null;
  }
};

// Calculate priority score for optimization efforts
const calculateStepPriorityScore = (step: AbandonmentAnalytics): number => {
  let score = 0;
  
  // High abandonment rate increases priority
  score += step.abandonment_rate * 0.5;
  
  // High value prospects increase priority
  score += step.high_value_count * 10;
  
  // Low conversion with high potential increases priority
  if (step.conversion_rate < 10 && step.avg_recovery_potential > 500000) {
    score += 20;
  }
  
  return Math.round(score);
};

// Identify high priority actions
const identifyHighPriorityActions = (abandonmentData: AbandonmentAnalytics[]): string[] => {
  const actions: string[] = [];
  
  // Find step with highest priority score
  const highestPriorityStep = abandonmentData.reduce((max, step) => 
    calculateStepPriorityScore(step) > calculateStepPriorityScore(max) ? step : max
  );
  
  actions.push(`Focus optimization efforts on Step ${highestPriorityStep.current_step} (Priority Score: ${calculateStepPriorityScore(highestPriorityStep)})`);
  
  // Identify immediate opportunities
  const highValueSteps = abandonmentData.filter(s => s.high_value_count > 3);
  if (highValueSteps.length > 0) {
    actions.push(`Implement personal outreach for ${highValueSteps.length} steps with high-value prospects`);
  }
  
  const highAbandonmentSteps = abandonmentData.filter(s => s.abandonment_rate > 60);
  if (highAbandonmentSteps.length > 0) {
    actions.push(`Urgently review UX for ${highAbandonmentSteps.length} steps with >60% abandonment`);
  }
  
  return actions;
};

// Track individual email events (opens, clicks, conversions)
export const trackEmailEvent = async (
  sequenceType: string, 
  contactEmail: string, 
  eventType: 'opened' | 'clicked' | 'converted',
  revenueAmount: number = 0
) => {
  try {
    const { error } = await supabase.rpc('track_email_performance', {
      p_sequence_type: sequenceType,
      p_contact_email: contactEmail,
      p_event_type: eventType,
      p_revenue_amount: revenueAmount
    });
    
    if (error) throw error;
    
    console.log(`Email ${eventType} tracked for ${sequenceType} - ${contactEmail}`);
  } catch (error) {
    console.error('Error tracking email event:', error);
  }
};

// Archive old converted submissions
export const archiveConvertedSubmissions = async (criteria: any) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('temporary_submissions')
      .update({ archived_at: new Date().toISOString() })
      .not('converted_to_user_id', 'is', null)
      .lt('conversion_completed_at', thirtyDaysAgo)
      .is('archived_at', null)
      .select('count');
    
    if (error) throw error;
    
    console.log('Archived old converted submissions');
    return data;
  } catch (error) {
    console.error('Error archiving converted submissions:', error);
    return null;
  }
};

// Delete expired unconverted submissions
export const deleteExpiredSubmissions = async (criteria: any) => {
  try {
    const { data, error } = await supabase
      .from('temporary_submissions')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .is('converted_to_user_id', null)
      .select('count');
    
    if (error) throw error;
    
    console.log('Deleted expired submissions');
    return data;
  } catch (error) {
    console.error('Error deleting expired submissions:', error);
    return null;
  }
};

// Clean up old email queue entries
export const cleanupEmailQueue = async (criteria: any) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('email_sequence_queue')
      .delete()
      .eq('status', 'sent')
      .lt('sent_at', sevenDaysAgo)
      .select('count');
    
    if (error) throw error;
    
    console.log('Cleaned up old email queue entries');
    return data;
  } catch (error) {
    console.error('Error cleaning up email queue:', error);
    return null;
  }
};

// Comprehensive database maintenance
export const performDatabaseMaintenance = async () => {
  try {
    console.log('Starting database maintenance...');
    
    // Use the database function for maintenance
    const { data, error } = await supabase.rpc('perform_database_cleanup');
    
    if (error) throw error;
    
    console.log(`Database maintenance completed. Processed ${data} records.`);
    
    // Send maintenance report to N8N
    await triggerN8NWorkflow('system-maintenance', {
      task: 'database_cleanup',
      records_processed: data,
      completed_at: new Date().toISOString(),
      status: 'success'
    });
    
    return data;
  } catch (error) {
    console.error('Database maintenance failed:', error);
    
    // Send failure notification
    await triggerN8NWorkflow('system-maintenance', {
      task: 'database_cleanup',
      status: 'failed',
      error: error.message,
      failed_at: new Date().toISOString()
    });
    
    throw error;
  }
};

// Generate comprehensive analytics dashboard data
export const generateAnalyticsDashboard = async () => {
  try {
    const [emailAnalytics, abandonmentAnalytics] = await Promise.all([
      getEmailSequenceAnalytics(),
      getAbandonmentAnalytics()
    ]);
    
    const dashboard = {
      email_performance: {
        sequences: emailAnalytics,
        summary: {
          total_sequences: emailAnalytics.length,
          avg_open_rate: emailAnalytics.reduce((sum, a) => sum + a.open_rate, 0) / emailAnalytics.length || 0,
          avg_click_rate: emailAnalytics.reduce((sum, a) => sum + a.click_rate, 0) / emailAnalytics.length || 0,
          total_revenue: emailAnalytics.reduce((sum, a) => sum + a.total_revenue, 0)
        }
      },
      abandonment_insights: {
        steps: abandonmentAnalytics,
        critical_points: abandonmentAnalytics.filter(s => s.abandonment_rate > 50),
        recovery_opportunities: abandonmentAnalytics.reduce((sum, s) => 
          sum + (s.avg_recovery_potential * (s.total_at_step - s.converted_from_step)), 0
        )
      },
      generated_at: new Date().toISOString()
    };
    
    return dashboard;
  } catch (error) {
    console.error('Error generating analytics dashboard:', error);
    return null;
  }
};