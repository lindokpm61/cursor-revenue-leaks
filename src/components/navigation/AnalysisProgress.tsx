
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface AnalysisProgressProps {
  current: number;
  total: number;
  percentage: number;
  label?: string;
  showProgress?: boolean;
  className?: string;
}

export const AnalysisProgress = ({ 
  current, 
  total, 
  percentage, 
  label,
  showProgress = false,
  className 
}: AnalysisProgressProps) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
        Step {current} of {total}
      </Badge>
      {label && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
      {showProgress && (
        <div className="flex items-center gap-2 min-w-[100px]">
          <Progress value={percentage} className="h-2" />
          <span className="text-xs text-muted-foreground">{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
};
