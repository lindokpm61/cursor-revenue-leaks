
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { analyticsService, userProfileService, integrationLogService } from "@/lib/supabase";
import { CalculatorData, Calculations } from "../useCalculatorData";
import { convertToUserSubmission, updateCalculatorProgress } from "@/lib/submission";
import { calculateLeadScore } from "@/lib/calculator/leadScoring";
import { mapToSubmissionData } from "@/lib/calculator/submissionDataMapper";

// Add manual auth state clearing utility
const clearAllAuthState = () => {
  console.log('🧹 Clearing all authentication state...');
  
  // Clear localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-') || key.startsWith('auth-')) {
      console.log('Removing localStorage key:', key);
      localStorage.removeItem(key);
    }
  });
  
  // Clear sessionStorage
  Object.keys(sessionStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-') || key.startsWith('auth-')) {
      console.log('Removing sessionStorage key:', key);
      sessionStorage.removeItem(key);
    }
  });
  
  console.log('✅ Auth state cleared');
};

export const useSaveResults = () => {
  const [saving, setSaving] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [pendingData, setPendingData] = useState<{ data: CalculatorData; calculations: Calculations } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savedSubmissionId, setSavedSubmissionId] = useState<string | null>(null);
  const { user, session, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Add manual modal trigger for debugging
  const forceShowRegistrationModal = (data: CalculatorData, calculations: Calculations) => {
    console.log('🔧 FORCING REGISTRATION MODAL - Debug Mode');
    setPendingData({ data, calculations });
    setShowRegistrationModal(true);
  };

  const handleSave = async (data: CalculatorData, calculations: Calculations) => {
    console.log('🚀 === SAVE BUTTON CLICKED - ENHANCED DEBUGGING ===');
    
    // Step 1: Clear any stale auth state first
    clearAllAuthState();
    
    // Step 2: Wait a moment for auth state to settle
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Step 3: Comprehensive authentication state logging
    console.log('📊 COMPREHENSIVE AUTH STATE CHECK:');
    console.log('  Raw user object:', user);
    console.log('  Raw session object:', session);
    console.log('  Loading state:', loading);
    console.log('  User ID:', user?.id || 'NO USER ID');
    console.log('  User email:', user?.email || 'NO EMAIL');
    console.log('  Session exists:', !!session);
    console.log('  Session user exists:', !!session?.user);
    console.log('  Session access token exists:', !!session?.access_token);
    console.log('  Session refresh token exists:', !!session?.refresh_token);
    
    if (session?.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000);
      const now = new Date();
      console.log('  Session expires at:', expiresAt.toISOString());
      console.log('  Current time:', now.toISOString());
      console.log('  Session is expired:', expiresAt <= now);
      console.log('  Session valid for:', Math.round((expiresAt.getTime() - now.getTime()) / 1000 / 60), 'minutes');
    } else {
      console.log('  Session has no expiration time');
    }
    
    // Step 4: Check localStorage/sessionStorage for any auth data
    console.log('🗄️ STORAGE STATE CHECK:');
    const authKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('supabase.auth.') || key.includes('sb-') || key.startsWith('auth-')
    );
    console.log('  Auth keys in localStorage:', authKeys);
    authKeys.forEach(key => {
      console.log(`    ${key}:`, localStorage.getItem(key)?.substring(0, 100) + '...');
    });
    
    // Step 5: Determine authentication status with explicit logic
    const isLoadingComplete = !loading;
    const hasValidUser = !!(user && user.id && user.email);
    const hasValidSession = !!(session && session.access_token);
    const sessionNotExpired = session?.expires_at ? new Date(session.expires_at * 1000) > new Date() : false;
    
    console.log('🔍 AUTH STATUS BREAKDOWN:');
    console.log('  Loading complete:', isLoadingComplete);
    console.log('  Has valid user:', hasValidUser);
    console.log('  Has valid session:', hasValidSession);
    console.log('  Session not expired:', sessionNotExpired);
    
    // CRITICAL: Use stricter authentication check
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

    try {
      // Update calculator progress regardless of auth status
      console.log('📊 Updating calculator progress...');
      await updateCalculatorProgress(5, {}, calculations);
      console.log('✅ Calculator progress updated successfully');
    } catch (error) {
      console.error('❌ Error updating final progress:', error);
    }

    // Decision point: Show registration modal or proceed with save
    if (!isAuthenticated) {
      console.log('🚪 USER NOT AUTHENTICATED - SHOWING REGISTRATION MODAL');
      console.log('  Setting pending data...');
      setPendingData({ data, calculations });
      console.log('  Opening registration modal...');
      setShowRegistrationModal(true);
      console.log('✅ Registration modal should now be visible');
      return;
    }

    console.log('🔓 USER IS AUTHENTICATED - PROCEEDING WITH SAVE');
    console.log('  User ID for save:', user.id);
    setSaving(true);
    
    try {
      console.log('📈 Calculating lead score...');
      const leadScore = calculateLeadScore(data, calculations);
      console.log('  Lead score calculated:', leadScore);
      
      console.log('🗂️ Mapping submission data...');
      const submissionData = mapToSubmissionData(data, calculations, leadScore, user.id);
      console.log('  Submission data mapped:', submissionData);

      console.log('💾 Converting to user submission...');
      const savedSubmission = await convertToUserSubmission(user.id, submissionData);
      console.log('  Submission saved:', savedSubmission);

      if (!savedSubmission) {
        throw new Error('Failed to save submission - no submission returned');
      }

      // Track analytics
      console.log('📊 Tracking analytics...');
      await analyticsService.track('submission_saved', savedSubmission.id);

      // Update user profile analytics
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

      // Log integration activity
      console.log('🔗 Logging integration activity...');
      await integrationLogService.create({
        submission_id: savedSubmission.id,
        integration_type: 'calculator_save',
        status: 'success',
        response_data: { submission_id: savedSubmission.id, total_leak: calculations.totalLeakage }
      });

      // Update local state
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
        stack: error instanceof Error ? error.stack : undefined
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
    navigateToResults,
    // Debug helpers
    forceShowRegistrationModal,
    clearAllAuthState
  };
};
