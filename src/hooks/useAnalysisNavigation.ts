
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';
import { NavigationService, NavigationContext, BreadcrumbItem } from '@/lib/navigationService';

export interface UseAnalysisNavigationReturn {
  // Navigation functions
  navigateToResults: (submissionId: string, options?: { replace?: boolean }) => void;
  navigateToActionPlan: (submissionId: string, options?: { replace?: boolean }) => void;
  navigateToDashboard: () => void;
  navigateToLanding: () => void;
  navigateBack: (fallbackPath?: string) => void;
  
  // Context and helpers
  context: NavigationContext;
  breadcrumbs: BreadcrumbItem[];
  progressInfo: { current: number; total: number; percentage: number };
  
  // Validation
  validateSubmissionId: (submissionId?: string) => boolean;
  
  // External navigation
  openExternalLink: (url: string) => void;
}

export const useAnalysisNavigation = (
  submissionId?: string,
  companyName?: string
): UseAnalysisNavigationReturn => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Create navigation service instance
  const navigationService = useMemo(() => {
    return new NavigationService(navigate, toast);
  }, [navigate, toast]);

  // Get current navigation context
  const context = useMemo(() => {
    return navigationService.getNavigationContext(location.pathname, submissionId);
  }, [navigationService, location.pathname, submissionId]);

  // Generate breadcrumbs
  const breadcrumbs = useMemo(() => {
    return navigationService.generateBreadcrumbs(context, companyName);
  }, [navigationService, context, companyName]);

  // Calculate progress info
  const progressInfo = useMemo(() => {
    return navigationService.getProgressInfo(context);
  }, [navigationService, context]);

  return {
    // Navigation functions
    navigateToResults: navigationService.navigateToResults.bind(navigationService),
    navigateToActionPlan: navigationService.navigateToActionPlan.bind(navigationService),
    navigateToDashboard: navigationService.navigateToDashboard.bind(navigationService),
    navigateToLanding: navigationService.navigateToLanding.bind(navigationService),
    navigateBack: navigationService.navigateBack.bind(navigationService),
    
    // Context and helpers
    context,
    breadcrumbs,
    progressInfo,
    
    // Validation
    validateSubmissionId: navigationService.validateSubmissionId.bind(navigationService),
    
    // External navigation
    openExternalLink: navigationService.openExternalLink.bind(navigationService)
  };
};
