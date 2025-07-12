import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { analyticsService, userProfileService, integrationLogService } from "@/lib/supabase";
import { CalculatorData, Calculations } from "../useCalculatorData";
import { convertToUserSubmission, updateCalculatorProgress } from "@/lib/submission";
import { calculateLeadScore } from "@/lib/calculator/leadScoring";
import { mapToSubmissionData } from "@/lib/calculator/submissionDataMapper";

export const useSaveResults = () => {
  const [saving, setSaving] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [pendingData, setPendingData] = useState<{ data: CalculatorData; calculations: Calculations } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSave = async (data: CalculatorData, calculations: Calculations) => {
    console.log('Save button clicked, user:', user);
    
    // First, save final step data to temporary submission
    try {
      await updateCalculatorProgress(5, {}, calculations);
    } catch (error) {
      console.error('Error updating final progress:', error);
    }
    
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
      const submissionData = mapToSubmissionData(data, calculations, leadScore, user.id);

      // Use convertToUserSubmission to trigger CRM integration
      console.log('About to call convertToUserSubmission with submissionData:', submissionData);
      console.log('Calling convertToUserSubmission with user ID:', user.id);
      const savedSubmission = await convertToUserSubmission(user.id, submissionData);
      console.log('convertToUserSubmission completed, saved submission:', savedSubmission);
      console.log('CRM integration should have been triggered for submission:', savedSubmission?.id);

      // Track analytics
      await analyticsService.track('submission_saved', savedSubmission?.id);

      // Update user profile analytics
      try {
        await userProfileService.incrementAnalysis(user.id, calculations.totalLeakage);
      } catch (profileError) {
        console.warn('User profile error (non-blocking):', profileError);
        // If profile doesn't exist, create it
        try {
          await userProfileService.create({
            id: user.id,
            companies_analyzed: 1,
            total_opportunity: calculations.totalLeakage,
            last_analysis_date: new Date().toISOString()
          });
        } catch (createError) {
          console.warn('Failed to create user profile (non-blocking):', createError);
        }
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