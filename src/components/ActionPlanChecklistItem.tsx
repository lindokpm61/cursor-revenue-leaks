
import { useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, Users, AlertTriangle } from "lucide-react";

interface ActionPlanChecklistItemProps {
  id: string;
  title: string;
  description: string;
  weeks: number;
  owner: string;
  recoveryPotential: number;
  difficulty: 'easy' | 'medium' | 'hard';
  riskLevel: 'low' | 'medium' | 'high';
  prerequisites?: string[];
  isCompleted?: boolean;
  onToggle?: (id: string, completed: boolean) => void;
  formatCurrency: (amount: number) => string;
}

export const ActionPlanChecklistItem = ({
  id,
  title,
  description,
  weeks,
  owner,
  recoveryPotential,
  difficulty,
  riskLevel,
  prerequisites = [],
  isCompleted = false,
  onToggle,
  formatCurrency
}: ActionPlanChecklistItemProps) => {
  const [completed, setCompleted] = useState(isCompleted);

  const handleToggle = (checked: boolean) => {
    setCompleted(checked);
    onToggle?.(id, checked);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`p-4 border rounded-lg transition-all ${completed ? 'bg-green-50 border-green-200' : 'bg-background'}`}>
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          checked={completed}
          onCheckedChange={handleToggle}
          className="mt-1"
        />
        
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <label 
                htmlFor={id} 
                className={`font-medium cursor-pointer ${completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
              >
                {title}
              </label>
              <p className={`text-sm mt-1 ${completed ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                {description}
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <Badge className={getDifficultyColor(difficulty)}>
                {difficulty}
              </Badge>
              {riskLevel !== 'low' && (
                <div className={`flex items-center gap-1 text-xs ${getRiskColor(riskLevel)}`}>
                  <AlertTriangle className="h-3 w-3" />
                  {riskLevel} risk
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{weeks} weeks</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{owner}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">
                {formatCurrency(recoveryPotential)} recovery
              </span>
            </div>
            {prerequisites.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Requires: {prerequisites.join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
