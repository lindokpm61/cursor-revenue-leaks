import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';

interface ErrorMessageProps {
  title?: string;
  message?: string;
  showRefresh?: boolean;
  showHome?: boolean;
  onRefresh?: () => void;
  onHome?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  showRefresh = true,
  showHome = false,
  onRefresh,
  onHome,
}) => {
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  const handleHome = () => {
    if (onHome) {
      onHome();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-destructive/20">
        <CardContent className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {title}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-6">
            {message}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {showRefresh && (
              <Button 
                onClick={handleRefresh}
                variant="default"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
            
            {showHome && (
              <Button 
                onClick={handleHome}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};