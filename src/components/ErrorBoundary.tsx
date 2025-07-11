import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Track error for analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      });
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Return fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                onClick={this.handleRetry}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button 
                onClick={this.handleReload}
                size="sm"
                className="flex-1"
              >
                Reload Page
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-3 bg-muted rounded text-xs">
                <summary className="cursor-pointer font-medium mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Calculator-specific error boundary
export const CalculatorErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Calculator Error:', error, errorInfo);
        // Could send to analytics or error tracking service
      }}
      fallback={
        <Alert variant="destructive" className="m-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Calculator Error</AlertTitle>
          <AlertDescription>
            There was an issue with the revenue calculator. Please refresh the page to try again.
          </AlertDescription>
        </Alert>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

// Global app error boundary
export const GlobalErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Global App Error:', error, errorInfo);
        // Send to error tracking service
      }}
    >
      {children}
    </ErrorBoundary>
  );
};