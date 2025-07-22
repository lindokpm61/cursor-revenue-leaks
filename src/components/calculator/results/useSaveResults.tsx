
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { analyticsService, userProfileService, integrationLogService } from "@/lib/supabase";
import { CalculatorData, Calculations } from "../useCalculatorData";
import { convertToUserSubmission, updateCalculatorProgress } from "@/lib/submission";
import { calculateLeadScore } from "@/lib/calculator/leadScoring";
import { mapToSubmissionData } from "@/lib/calculator/submissionDataMapper";
import { useAsyncOperation } from "@/hooks/useAsyncOperation";

export const useSaveResults = () => {
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [pendingData, setPendingData] = useState<{ data: CalculatorData; calculations: Calculations } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savedSubmissionId, setSavedSubmissionId] = useState<string | null>(null);
  const { user, session, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const saveOperation = useAsyncOperation<string>();

  const handleSave = async (data: CalculatorData, calculations: Calculations) => {
    console.log('🚀 === SAVE BUTTON CLICKED - STARTING SAVE PROCESS ===');
    console.log('🔍 DETAILED INPUT VALIDATION:');
    console.log('  Raw data object:', data);
    console.log('  Raw calculations object:', calculations);
    
    // Validate calculations object structure in detail
    if (!calculations) {
      console.error('❌ CRITICAL: Calculations object is null/undefined at save time!');
      toast({
        title: "Calculation Error",
        description: "Calculations are missing. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    await saveOperation.execute(async () => {
      // STEP 2: Update calculator progress first
      console.log('📊 Updating calculator progress...');
      await updateCalculatorProgress(5, {}, calculations);
      console.log('✅ Calculator progress updated successfully');
      
      // STEP 3: Comprehensive authentication state check
      console.log('🔍 === DETAILED AUTH STATE CHECK ===');
      console.log('  User object:', user);
      console.log('  Session object:', session);
      console.log('  Loading state:', loading);
      
      // Check session expiration
      let sessionExpired = false;
      if (session?.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000);
        const now = new Date();
        sessionExpired = expiresAt <= now;
        console.log('  Session is expired:', sessionExpired);
      }
      
      // Determine authentication status
      const isLoadingComplete = !loading;
      const hasValidUser = !!(user && user.id && user.email);
      const hasValidSession = !!(session && session.access_token);
      const sessionNotExpired = !sessionExpired;
      
      const isAuthenticated = isLoadingComplete && hasValidUser && hasValidSession && sessionNotExpired;
      
      console.log('🎯 FINAL AUTHENTICATION DECISION:', { isAuthenticated });

      // Handle unauthenticated users
      if (!isAuthenticated) {
        console.log('🚪 USER NOT AUTHENTICATED - SHOWING REGISTRATION MODAL');
        setPendingData({ data, calculations });
        setShowRegistrationModal(true);
        
        toast({
          title: "Account Required",
          description: "Create a free account to save your analysis to your dashboard.",
          variant: "default",
        });
        
        throw new Error('Authentication required');
      }

      // STEP 7: Proceed with authenticated save
      console.log('🔓 USER IS AUTHENTICATED - PROCEEDING WITH SAVE');
      
      console.log('📈 Calculating lead score...');
      const leadScore = calculateLeadScore(data, calculations);
      
      console.log('🗂️ Mapping submission data...');
      const submissionData = mapToSubmissionData(data, calculations, leadScore, user.id);

      console.log('💾 Converting to user submission...');
      const savedSubmission = await convertToUserSubmission(user.id, submissionData);

      if (!savedSubmission) {
        throw new Error('Failed to save submission - no submission returned');
      }

      // Track analytics
      await analyticsService.track('submission_saved', savedSubmission.id);

      // Update user profile analytics
      try {
        await userProfileService.incrementAnalysis(user.id, calculations.totalLeakage);
      } catch (profileError) {
        console.warn('⚠️ User profile error (non-blocking):', profileError);
        try {
          await userProfileService.create({
            id: user.id,
            companies_analyzed: 1,
            total_opportunity: calculations.totalLeakage,
            last_analysis_date: new Date().toISOString()
          });
        } catch (createError) {
          console.warn('⚠️ Failed to create user profile (non-blocking):', createError);
        }
      }

      // Log integration activity
      await integrationLogService.create({
        submission_id: savedSubmission.id,
        integration_type: 'calculator_save',
        status: 'success',
        response_data: { submission_id: savedSubmission.id, total_leak: calculations.totalLeakage }
      });

      // Update local state
      setIsSaved(true);
      setSavedSubmissionId(savedSubmission.id);

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

      console.log('🎊 === SAVE COMPLETED SUCCESSFULLY ===');
      return savedSubmission.id;
    }, {
      onProgress: (progress) => console.log(`Save progress: ${progress}%`),
      loadingText: "Saving your strategic analysis..."
    });

    // Handle save operation errors
    if (saveOperation.error) {
      console.error('💥 === SAVE FAILED ===');
      console.error('Error saving submission:', saveOperation.error);
      
      toast({
        title: "Save Failed",
        description: saveOperation.error.message || "Failed to save your results. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRegistrationSuccess = (submissionId: string) => {
    console.log('🎯 Registration successful, submission ID:', submissionId);
    
    setShowRegistrationModal(false);
    setPendingData(null);
    setIsSaved(true);
    setSavedSubmissionId(submissionId);
    
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
    console.log('❌ Closing registration modal');
    setShowRegistrationModal(false);
    setPendingData(null);
  };

  const navigateToDashboard = () => {
    console.log('🏠 Navigating to dashboard');
    navigate("/dashboard");
  };

  const navigateToResults = () => {
    console.log('📊 Navigating to results, savedSubmissionId:', savedSubmissionId);
    if (savedSubmissionId) {
      navigate(`/results/${savedSubmissionId}`);
    }
  };

  // Debug functions
  const forceShowRegistrationModal = (data: CalculatorData, calculations: Calculations) => {
    console.log('🐛 DEBUG: Force showing registration modal');
    setPendingData({ data, calculations });
    setShowRegistrationModal(true);
  };

  const clearAllAuthState = () => {
    console.log('🐛 DEBUG: Clearing all auth state');
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    setIsSaved(false);
    setSavedSubmissionId(null);
    setPendingData(null);
    setShowRegistrationModal(false);
    saveOperation.reset();
  };

  return { 
    handleSave, 
    saving: saveOperation.loading,
    saveProgress: saveOperation.progress,
    showRegistrationModal, 
    pendingData, 
    handleRegistrationSuccess, 
    handleCloseRegistrationModal,
    isSaved,
    savedSubmissionId,
    navigateToDashboard,
    navigateToResults,
    forceShowRegistrationModal,
    clearAllAuthState
  };
};
