
import { NavigateFunction } from 'react-router-dom';

export interface NavigationContext {
  currentPage: 'results' | 'action-plan' | 'dashboard' | 'landing';
  submissionId?: string;
  step?: number;
  totalSteps?: number;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
  isActive: boolean;
}

export class NavigationService {
  private navigate: NavigateFunction;
  private showToast: (options: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;

  constructor(navigate: NavigateFunction, showToast: (options: any) => void) {
    this.navigate = navigate;
    this.showToast = showToast;
  }

  // Analysis flow navigation
  navigateToResults(submissionId: string, options?: { replace?: boolean }) {
    if (!submissionId || submissionId === ':id' || submissionId.includes(':')) {
      this.showToast({
        title: "Navigation Error",
        description: "Invalid submission ID. Redirecting to dashboard.",
        variant: "destructive"
      });
      this.navigate('/dashboard');
      return;
    }

    this.navigate(`/results/${submissionId}`, { replace: options?.replace });
  }

  navigateToActionPlan(submissionId: string, options?: { replace?: boolean }) {
    if (!submissionId || submissionId === ':id' || submissionId.includes(':')) {
      this.showToast({
        title: "Navigation Error",
        description: "Invalid submission ID. Redirecting to dashboard.",
        variant: "destructive"
      });
      this.navigate('/dashboard');
      return;
    }

    this.navigate(`/action-plan/${submissionId}`, { replace: options?.replace });
  }

  // Common navigation actions
  navigateToDashboard() {
    this.navigate('/dashboard');
  }

  navigateToLanding() {
    this.navigate('/');
  }

  navigateBack(fallbackPath: string = '/dashboard') {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.navigate(fallbackPath);
    }
  }

  // Context-aware navigation helpers
  getNavigationContext(pathname: string, submissionId?: string): NavigationContext {
    if (pathname.includes('/results/')) {
      return {
        currentPage: 'results',
        submissionId,
        step: 4,
        totalSteps: 5
      };
    }
    
    if (pathname.includes('/action-plan/')) {
      return {
        currentPage: 'action-plan',
        submissionId,
        step: 5,
        totalSteps: 5
      };
    }

    if (pathname === '/dashboard') {
      return { currentPage: 'dashboard' };
    }

    return { currentPage: 'landing' };
  }

  // Breadcrumb generation
  generateBreadcrumbs(context: NavigationContext, companyName?: string): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [
      {
        label: 'Dashboard',
        path: '/dashboard',
        isActive: false
      }
    ];

    if (context.submissionId) {
      const displayName = companyName || 'Analysis';
      
      if (context.currentPage === 'results') {
        breadcrumbs.push({
          label: `${displayName} - Results`,
          isActive: true
        });
      } else if (context.currentPage === 'action-plan') {
        breadcrumbs.push(
          {
            label: `${displayName} - Results`,
            path: `/results/${context.submissionId}`,
            isActive: false
          },
          {
            label: 'Action Plan',
            isActive: true
          }
        );
      }
    }

    return breadcrumbs;
  }

  // Progress calculation
  getProgressInfo(context: NavigationContext): { current: number; total: number; percentage: number } {
    const current = context.step || 1;
    const total = context.totalSteps || 5;
    const percentage = (current / total) * 100;

    return { current, total, percentage };
  }

  // Validation helpers
  validateSubmissionId(submissionId?: string): boolean {
    return !!(submissionId && 
              submissionId !== ':id' && 
              !submissionId.includes(':') && 
              submissionId.length > 10);
  }

  // External navigation
  openExternalLink(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
