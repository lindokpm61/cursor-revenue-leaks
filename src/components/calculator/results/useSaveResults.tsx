
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
  const [isSaved, setIsSaved] = useState(false);
  const [savedSubmissionId, setSavedSubmissionId] = useState<string | null>(null);
  const { user, session, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSave = async (data: CalculatorData, calculations: Calculations) => {
    console.log('=== SAVE BUTTON CLICKED ===');
    console.log('Authentication state check:', { 
      user: user?.id || 'NO USER', 
      email: user?.email || 'NO EMAIL',
      hasSession: !!session,
      sessionValid: session?.expires_at ? new Date(session.expires_at * 1000) > new Date() : false,
      loading,
      isAuthenticated: !!user && !!session
    });
    console.log('Calculator data:', data);
    console.log('Calculations:', calculations);
    
    try {
      // First, save final step data to temporary submission
      console.log('Updating calculator progress...');
      await updateCalculatorProgress(5, {}, calculations);
      console.log('Calculator progress updated successfully');
    } catch (error) {
      console.error('Error updating final progress:', error);
    }
    
    // Enhanced authentication check - ensure we have both user AND valid session
    const isUserAuthenticated = !loading && user && session && 
      session.expires_at && new Date(session.expires_at * 1000) > new Date();
    
    console.log('Final authentication decision:', {
      isUserAuthenticated,
      userExists: !!user,
      sessionExists: !!session,
      sessionNotExpired: session?.expires_at ? new Date(session.expires_at * 1000) > new Date() : false,
      notLoading: !loading
    });

    if (!isUserAuthenticated) {
      console.log('User not authenticated - showing registration modal');
      setPendingData({ data, calculations });
      setShowRegistrationModal(true);
      return;
    }

    console.log('Starting save with authenticated user:', user.id);
    setSaving(true);
    
    try {
      console.log('Calculating lead score...');
      const leadScore = calculateLeadScore(data, calculations);
      console.log('Lead score calculated:', leadScore);
      
      console.log('Mapping submission data...');
      const submissionData = mapToSubmissionData(data, calculations, leadScore, user.id);
      console.log('Submission data mapped:', submissionData);

      // Use convertToUserSubmission to trigger CRM integration
      console.log('About to call convertToUserSubmission...');
      const savedSubmission = await convertToUserSubmission(user.id, submissionData);
      console.log('convertToUserSubmission completed, saved submission:', savedSubmission);

      if (!savedSubmission) {
        throw new Error('Failed to save submission - no submission returned');
      }

      // Track analytics
      console.log('Tracking analytics...');
      await analyticsService.track('submission_saved', savedSubmission.id);

      // Update user profile analytics
      try {
        console.log('Updating user profile analytics...');
        await userProfileService.incrementAnalysis(user.id, calculations.totalLeakage);
        console.log('User profile updated successfully');
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
          console.log('User profile created successfully');
        } catch (createError) {
          console.warn('Failed to create user profile (non-blocking):', createError);
        }
      }

      // Log integration activity
      console.log('Logging integration activity...');
      await integrationLogService.create({
        submission_id: savedSubmission.id,
        integration_type: 'calculator_save',
        status: 'success',
        response_data: { submission_id: savedSubmission.id, total_leak: calculations.totalLeakage }
      });

      // Update local state to show saved status
      console.log('Updating local state...');
      setIsSaved(true);
      setSavedSubmissionId(savedSubmission.id);

      console.log('Showing success toast...');
      toast({
        title: "Analysis Saved Successfully! ✓",
        description: "Your revenue analysis is now saved to your dashboard.",
        action: savedSubmission.id ? (
          <button 
            onClick={() => navigate("/dashboard")}
            className="text-primary hover:underline text-sm font-medium"
          >
            View Dashboard →
          </button>
        ) : undefined
      });

      console.log('=== SAVE COMPLETED SUCCESSFULLY ===');

    } catch (error) {
      console.error('=== SAVE FAILED ===');
      console.error('Error saving submission:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save your results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      console.log('Save process completed, saving state set to false');
    }
  };

  const handleRegistrationSuccess = (submissionId: string) => {
    console.log('Registration successful, submission ID:', submissionId);
    
    // Close the modal and update state
    setShowRegistrationModal(false);
    setPendingData(null);
    setIsSaved(true);
    setSavedSubmissionId(submissionId);
    
    // Show success toast with dashboard option
    toast({
      title: "Account Created & Analysis Saved! ✓",
      description: "Welcome! Your revenue analysis is now saved to your dashboard.",
      action: (
        <button 
          onClick={() => navigate("/dashboard")}
          className="text-primary hover:underline text-sm font-medium"
        >
          View Dashboard →
        </button>
      )
    });
  };

  const handleCloseRegistrationModal = () => {
    console.log('Closing registration modal');
    setShowRegistrationModal(false);
    setPendingData(null);
  };

  const navigateToDashboard = () => {
    console.log('Navigating to dashboard');
    navigate("/dashboard");
  };

  const navigateToResults = () => {
    console.log('Navigating to results, savedSubmissionId:', savedSubmissionId);
    if (savedSubmissionId) {
      navigate(`/results/${savedSubmissionId}`);
    }
  };

  return { 
    handleSave, 
    saving, 
    showRegistrationModal, 
    pendingData, 
    handleRegistrationSuccess, 
    handleCloseRegistrationModal,
    isSaved,
    savedSubmissionId,
    navigateToDashboard,
    navigateToResults
  };
};
