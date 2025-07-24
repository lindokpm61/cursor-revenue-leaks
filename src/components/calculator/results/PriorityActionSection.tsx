
import { AlertTriangle, TrendingUp } from "lucide-react";
import { ActionCard } from "./ActionCard";

interface ActionItem {
  id: string;
  title: string;
  description: string;
  currentMetric: string;
  targetMetric: string;
  potentialRecovery: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeframe: string;
  icon: any;
  priority: 'urgent' | 'medium';
  currentProgress: number;
  targetProgress: number;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
  implementationSteps: string[];
  dependencies: string[];
  whyItMatters: string;
  complexity: string;
  paybackPeriod: string;
}

interface PriorityActionSectionProps {
  title: string;
  actions: ActionItem[];
  formatCurrency: (amount: number) => string;
  sectionType: 'urgent' | 'medium';
}

export const PriorityActionSection = ({ title, actions, formatCurrency, sectionType }: PriorityActionSectionProps) => {
  const sectionConfig = {
    urgent: {
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: AlertTriangle,
      headerBg: 'bg-red-100',
      emoji: '🚨'
    },
    medium: {
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: TrendingUp,
      headerBg: 'bg-orange-100',
      emoji: '📈'
    }
  };

  const config = sectionConfig[sectionType];
  const SectionIcon = config.icon;

  if (actions.length === 0) return null;

  const totalRecovery = actions.reduce((sum, action) => sum + action.potentialRecovery, 0);
  const avgTimeframe = actions.length > 0 ? 
    actions.map(a => a.timeframe).join(', ').includes('week') ? 
      `${Math.min(...actions.map(a => parseInt(a.timeframe.split('-')[0])))} weeks avg` : 
      `${Math.round(actions.reduce((sum, a) => sum + parseInt(a.timeframe.split('-')[0] || '8'), 0) / actions.length)} weeks avg` : '';

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className={`${config.headerBg} border ${config.borderColor} rounded-lg p-4`}>
        <div className="flex items-center gap-3 mb-3">
          <SectionIcon className={`h-6 w-6 ${config.color}`} />
          <h3 className={`text-xl font-bold ${config.color}`}>
            {config.emoji} {title}
          </h3>
        </div>
        
        {/* Section Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Actions Count:</span>
            <div className="font-semibold">{actions.length} priorities</div>
          </div>
          <div>
            <span className="text-muted-foreground">Total Recovery:</span>
            <div className="font-bold text-green-600">{formatCurrency(totalRecovery)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Avg Timeline:</span>
            <div className="font-semibold">{avgTimeframe}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Complexity:</span>
            <div className="font-semibold">
              {actions.filter(a => a.difficulty === 'Easy').length > 0 && `${actions.filter(a => a.difficulty === 'Easy').length} Easy`}
              {actions.filter(a => a.difficulty === 'Medium').length > 0 && ` ${actions.filter(a => a.difficulty === 'Medium').length} Medium`}
              {actions.filter(a => a.difficulty === 'Hard').length > 0 && ` ${actions.filter(a => a.difficulty === 'Hard').length} Hard`}
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="space-y-4">
        {actions.map((action) => (
          <ActionCard
            key={action.id}
            action={action}
            formatCurrency={formatCurrency}
            priorityConfig={{
              color: config.color,
              bgColor: config.bgColor,
              borderColor: config.borderColor,
              icon: config.emoji,
              label: sectionType
            }}
          />
        ))}
      </div>
    </div>
  );
};
