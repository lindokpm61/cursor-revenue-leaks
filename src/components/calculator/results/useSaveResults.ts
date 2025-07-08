import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { submissionService, analyticsService, userProfileService, integrationLogService } from "@/lib/supabase";
import { CalculatorData, Calculations } from "../useCalculatorData";

const calculateLeadScore = (data: CalculatorData, calculations: Calculations): number => {
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
  if (industry.includes('technology') || industry.includes('saas') || industry.includes('software')) {
    score += 10; // Technology/SaaS
  } else if (industry.includes('finance') || industry.includes('financial')) {
    score += 8; // Finance
  } else {
    score += 5; // Other
  }
  
  return Math.min(score, 100); // Cap at 100
};

export const useSaveResults = () => {
  const [saving, setSaving] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [pendingData, setPendingData] = useState<{ data: CalculatorData; calculations: Calculations } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSave = async (data: CalculatorData, calculations: Calculations) => {
    console.log('Save button clicked, user:', user);
    
    if (!user) {
      console.log('No user found, showing registration modal');
      setPendingData({ data, calculations });
      setShowRegistrationModal(true);
      return;
    }

    console.log('Starting save with user:', user.id);
    console.log('User auth data:', { id: user.id, email: user.email });
    setSaving(true);
    try {
      const leadScore = calculateLeadScore(data, calculations);
      
      const submissionData = {
        company_name: data.companyInfo.companyName,
        contact_email: data.companyInfo.email,
        industry: data.companyInfo.industry,
        current_arr: data.companyInfo.currentARR,
        monthly_leads: data.leadGeneration.monthlyLeads,
        average_deal_value: data.leadGeneration.averageDealValue,
        lead_response_time: data.leadGeneration.leadResponseTimeHours,
        monthly_free_signups: data.selfServeMetrics.monthlyFreeSignups,
        free_to_paid_conversion: data.selfServeMetrics.freeToPaidConversionRate,
        monthly_mrr: data.selfServeMetrics.monthlyMRR,
        failed_payment_rate: data.operationsData.failedPaymentRate,
        manual_hours: data.operationsData.manualHoursPerWeek,
        hourly_rate: data.operationsData.hourlyRate,
        lead_response_loss: Math.round(calculations.leadResponseLoss),
        failed_payment_loss: Math.round(calculations.failedPaymentLoss),
        selfserve_gap_loss: Math.round(calculations.selfServeGap),
        process_inefficiency_loss: Math.round(calculations.processLoss),
        total_leak: Math.round(calculations.totalLeakage),
        recovery_potential_70: Math.round(calculations.potentialRecovery70),
        recovery_potential_85: Math.round(calculations.potentialRecovery85),
        leak_percentage: data.companyInfo.currentARR > 0 
          ? Math.round((calculations.totalLeakage / data.companyInfo.currentARR) * 100)
          : 0,
        lead_score: leadScore,
        user_id: user.id,
      };

      console.log('Submitting data:', submissionData);
      const { data: savedSubmission, error } = await submissionService.create(submissionData);
      
      if (error) {
        console.error('Supabase error:', JSON.stringify(error, null, 2));
        throw error;
      }

      // Track analytics
      await analyticsService.track('submission_saved', savedSubmission?.id);

      // Update user profile analytics
      try {
        await userProfileService.incrementAnalysis(user.id, calculations.totalLeakage);
      } catch (profileError) {
        // If profile doesn't exist, create it
        await userProfileService.create({
          id: user.id,
          companies_analyzed: 1,
          total_opportunity: calculations.totalLeakage,
          last_analysis_date: new Date().toISOString()
        });
      }

      // Log integration activity
      await integrationLogService.create({
        submission_id: savedSubmission?.id,
        integration_type: 'calculator_save',
        status: 'success',
        response_data: { submission_id: savedSubmission?.id, total_leak: calculations.totalLeakage }
      });

      toast({
        title: "Results Saved",
        description: "Your revenue analysis has been saved successfully",
      });

      // Navigate to results page
      if (savedSubmission?.id) {
        navigate(`/results/${savedSubmission.id}`);
      }
    } catch (error) {
      console.error('Error saving submission:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save your results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRegistrationSuccess = (submissionId: string) => {
    setShowRegistrationModal(false);
    setPendingData(null);
    
    toast({
      title: "Account Created Successfully",
      description: "Your revenue analysis has been saved!",
    });
    
    navigate(`/results/${submissionId}`);
  };

  const handleCloseRegistrationModal = () => {
    setShowRegistrationModal(false);
    setPendingData(null);
  };

  return { 
    handleSave, 
    saving, 
    showRegistrationModal, 
    pendingData, 
    handleRegistrationSuccess, 
    handleCloseRegistrationModal 
  };
};