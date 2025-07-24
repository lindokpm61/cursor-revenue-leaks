import { useState, useEffect } from 'react';
import { userPatternService } from '@/lib/supabase';

interface UserPattern {
  user_type: string;
  business_model: string;
  value_tier: string;
  total_companies: number;
  unique_industries: number;
  total_arr: number;
}

interface UserPatternAnalysis {
  pattern: UserPattern | null;
  submissions: any[];
  loading: boolean;
  error: string | null;
}

export const useUserPattern = (email: string): UserPatternAnalysis => {
  const [analysis, setAnalysis] = useState<UserPatternAnalysis>({
    pattern: null,
    submissions: [],
    loading: false,
    error: null
  });

  const analyzePattern = async (userEmail: string) => {
    if (!userEmail || !userEmail.includes('@')) return;

    setAnalysis(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Get user's existing submissions
      const { data: submissions, error: submissionsError } = await userPatternService.getSubmissionsByEmail(userEmail);
      
      if (submissionsError) {
        throw new Error(submissionsError.message);
      }

      // Analyze pattern if submissions exist
      let pattern = null;
      if (submissions && submissions.length > 0) {
        const { data: patternData, error: patternError } = await userPatternService.analyzeUserPattern(userEmail);
        
        if (patternError) {
          console.warn('Pattern analysis failed:', patternError);
        } else {
          pattern = patternData;
        }
      }

      setAnalysis({
        pattern,
        submissions: submissions || [],
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('User pattern analysis error:', error);
      setAnalysis(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      }));
    }
  };

  useEffect(() => {
    if (email) {
      const debounced = setTimeout(() => analyzePattern(email), 500);
      return () => clearTimeout(debounced);
    }
  }, [email]);

  return analysis;
};

export const getUserTypeDisplayName = (userType: string): string => {
  switch (userType) {
    case 'consultant':
      return 'Consultant/Agency';
    case 'enterprise':
      return 'Enterprise Multi-Division';
    case 'investor':
      return 'Investor/PE';
    default:
      return 'Standard User';
  }
};

export const getBusinessModelDisplayName = (businessModel: string): string => {
  switch (businessModel) {
    case 'consulting':
      return 'Consulting/Advisory Services';
    case 'investment':
      return 'Investment/Due Diligence';
    case 'internal':
      return 'Internal Analysis';
    default:
      return 'Business Analysis';
  }
};