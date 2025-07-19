
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
    console.log('🚀 === SAVE BUTTON CLICKED - STARTING SAVE PROCESS ===');
    console.log('🔍 DETAILED INPUT VALIDATION:');
    console.log('  Raw data object:', data);
    console.log('  Raw calculations object:', calculations);
    console.log('  Calculations type:', typeof calculations);
    console.log('  Calculations is array:', Array.isArray(calculations));
    console.log('  Calculations keys:', Object.keys(calculations || {}));
    
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

    // Log each calculation value at save time
    console.log('📊 CALCULATION VALUES AT SAVE TIME:');
    const calcKeys = ['leadResponseLoss', 'failedPaymentLoss', 'selfServeGap', 'processLoss', 'totalLeakage', 'potentialRecovery70', 'potentialRecovery85'];
    calcKeys.forEach(key => {
      const value = calculations[key as keyof Calculations];
      console.log(`  ${key}:`, value, `(type: ${typeof value}, isNaN: ${isNaN(Number(value))})`);
    });
    
    // STEP 1: Set saving state immediately for visual feedback
    setSaving(true);
    
    try {
      // STEP 2: Update calculator progress first
      console.log('📊 Updating calculator progress...');
      await updateCalculatorProgress(5, {}, calculations);
      console.log('✅ Calculator progress updated successfully');
      
      // STEP 3: Comprehensive authentication state check
      console.log('🔍 === DETAILED AUTH STATE CHECK ===');
      console.log('  User object:', user);
      console.log('  Session object:', session);
      console.log('  Loading state:', loading);
      console.log('  User ID:', user?.id || 'NO USER ID');
      console.log('  User email:', user?.email || 'NO EMAIL');
      console.log('  Session exists:', !!session);
      console.log('  Session user exists:', !!session?.user);
      console.log('  Session access token exists:', !!session?.access_token);
      
      // STEP 4: Check session expiration
      let sessionExpired = false;
      if (session?.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000);
        const now = new Date();
        sessionExpired = expiresAt <= now;
        console.log('  Session expires at:', expiresAt.toISOString());
        console.log('  Current time:', now.toISOString());
        console.log('  Session is expired:', sessionExpired);
        console.log('  Session valid for:', Math.round((expiresAt.getTime() - now.getTime()) / 1000 / 60), 'minutes');
      }
      
      // STEP 5: Determine authentication status with explicit logic
      const isLoadingComplete = !loading;
      const hasValidUser = !!(user && user.id && user.email);
      const hasValidSession = !!(session && session.access_token);
      const sessionNotExpired = !sessionExpired;
      
      console.log('🎯 AUTH STATUS BREAKDOWN:');
      console.log('  Loading complete:', isLoadingComplete);
      console.log('  Has valid user:', hasValidUser);
      console.log('  Has valid session:', hasValidSession);
      console.log('  Session not expired:', sessionNotExpired);
      
      const isAuthenticated = isLoadingComplete && hasValidUser && hasValidSession && sessionNotExpired;
      
      console.log('🎯 FINAL AUTHENTICATION DECISION:', {
        isAuthenticated,
        reason: !isAuthenticated ? (
          !isLoadingComplete ? 'Still loading' :
          !hasValidUser ? 'No valid user' :
          !hasValidSession ? 'No valid session' :
          !sessionNotExpired ? 'Session expired' :
          'Unknown'
        ) : 'All checks passed'
      });

      // STEP 6: Handle unauthenticated users
      if (!isAuthenticated) {
        console.log('🚪 USER NOT AUTHENTICATED - SHOWING REGISTRATION MODAL');
        console.log('  Setting pending data...');
        setPendingData({ data, calculations });
        console.log('  Opening registration modal...');
        setShowRegistrationModal(true);
        console.log('✅ Registration modal should now be visible');
        
        toast({
          title: "Account Required",
          description: "Create a free account to save your analysis to your dashboard.",
          variant: "default",
        });
        
        return;
      }

      // STEP 7: Proceed with authenticated save
      console.log('🔓 USER IS AUTHENTICATED - PROCEEDING WITH SAVE');
      console.log('  User ID for save:', user.id);
      
      console.log('📈 Calculating lead score...');
      const leadScore = calculateLeadScore(data, calculations);
      console.log('  Lead score calculated:', leadScore);
      
      console.log('🗂️ Mapping submission data...');
      console.log('  About to call mapToSubmissionData with:');
      console.log('  - data:', data);
      console.log('  - calculations:', calculations);
      console.log('  - leadScore:', leadScore);
      console.log('  - userId:', user.id);
      
      const submissionData = mapToSubmissionData(data, calculations, leadScore, user.id);
      console.log('  Submission data mapped successfully:', submissionData);

      console.log('💾 Converting to user submission...');
      const savedSubmission = await convertToUserSubmission(user.id, submissionData);
      console.log('  Submission saved:', savedSubmission);

      if (!savedSubmission) {
        throw new Error('Failed to save submission - no submission returned');
      }

      // STEP 8: Track analytics
      console.log('📊 Tracking analytics...');
      await analyticsService.track('submission_saved', savedSubmission.id);

      // STEP 9: Update user profile analytics
      try {
        console.log('👤 Updating user profile analytics...');
        await userProfileService.incrementAnalysis(user.id, calculations.totalLeakage);
        console.log('✅ User profile updated successfully');
      } catch (profileError) {
        console.warn('⚠️ User profile error (non-blocking):', profileError);
        try {
          await userProfileService.create({
            id: user.id,
            companies_analyzed: 1,
            total_opportunity: calculations.totalLeakage,
            last_analysis_date: new Date().toISOString()
          });
          console.log('✅ User profile created successfully');
        } catch (createError) {
          console.warn('⚠️ Failed to create user profile (non-blocking):', createError);
        }
      }

      // STEP 10: Log integration activity
      console.log('🔗 Logging integration activity...');
      await integrationLogService.create({
        submission_id: savedSubmission.id,
        integration_type: 'calculator_save',
        status: 'success',
        response_data: { submission_id: savedSubmission.id, total_leak: calculations.totalLeakage }
      });

      // STEP 11: Update local state
      console.log('🔄 Updating local state...');
      setIsSaved(true);
      setSavedSubmissionId(savedSubmission.id);

      console.log('🎉 Showing success toast...');
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

    } catch (error) {
      console.error('💥 === SAVE FAILED ===');
      console.error('Error saving submission:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save your results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      console.log('🏁 Save process completed, saving state set to false');
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
