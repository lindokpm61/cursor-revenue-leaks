import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { submissionService, analyticsService } from "@/lib/supabase";
import { CalculatorData, Calculations } from "../useCalculatorData";

export const useSaveResults = () => {
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSave = async (data: CalculatorData, calculations: Calculations) => {
    console.log('Save button clicked, user:', user);
    
    if (!user) {
      console.log('No user found, showing auth required toast');
      toast({
        title: "Authentication Required",
        description: "Please log in to save your results",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting save with user:', user.id);
    console.log('User auth data:', { id: user.id, email: user.email });
    setSaving(true);
    try {
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
        user_id: user.id,
      };

      console.log('Submitting data:', submissionData);
      const { data: savedSubmission, error } = await submissionService.create(submissionData);
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Track analytics
      await analyticsService.track('submission_saved', savedSubmission?.id);

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

  return { handleSave, saving };
};