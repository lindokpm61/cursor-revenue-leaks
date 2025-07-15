import { UserIntent } from "@/components/results/UserIntentSelector";

interface ContentSection {
  id: string;
  component: string;
  priority: number;
  isExpanded?: boolean;
  isVisible?: boolean;
  variant?: 'condensed' | 'standard' | 'detailed' | 'competitive';
}

interface ContentSequenceConfig {
  sections: ContentSection[];
  progressiveSteps?: string[];
  accordionStates?: Record<string, boolean>;
}

export const useContentSequence = (userIntent: UserIntent) => {
  const getContentSequence = (): ContentSequenceConfig => {
    const baseConfig: ContentSequenceConfig = {
      sections: []
    };

    switch (userIntent) {
      case "quick-wins":
        return {
          sections: [
            { id: 'executive-summary', component: 'ExecutiveSummaryCard', priority: 1, isExpanded: true },
            { id: 'priority-actions', component: 'PriorityActions', priority: 2, isExpanded: true, variant: 'condensed' },
            { id: 'timeline', component: 'ImplementationTimeline', priority: 3, isExpanded: false, variant: 'condensed' },
            { id: 'revenue-overview', component: 'RevenueOverview', priority: 4, isExpanded: false },
            { id: 'enhanced-insights', component: 'EnhancedInsights', priority: 5, isExpanded: false },
            { id: 'benchmarking', component: 'IndustryBenchmarking', priority: 6, isExpanded: false }
          ],
          accordionStates: {
            'priority-actions': true,
            'timeline': false,
            'revenue-overview': false,
            'enhanced-insights': false,
            'benchmarking': false
          }
        };

      case "understand-problem":
        return {
          sections: [
            { id: 'executive-summary', component: 'ExecutiveSummaryCard', priority: 1, isExpanded: true },
            { id: 'revenue-overview', component: 'RevenueOverview', priority: 2, isExpanded: true },
            { id: 'enhanced-insights', component: 'EnhancedInsights', priority: 3, isExpanded: true },
            { id: 'priority-actions', component: 'PriorityActions', priority: 4, isExpanded: false },
            { id: 'benchmarking', component: 'IndustryBenchmarking', priority: 5, isExpanded: false },
            { id: 'timeline', component: 'ImplementationTimeline', priority: 6, isExpanded: false }
          ],
          accordionStates: {
            'executive-summary': true,
            'revenue-overview': true,
            'enhanced-insights': true,
            'priority-actions': false,
            'benchmarking': false,
            'timeline': false
          }
        };

      case "compare-competitors":
        return {
          sections: [
            { id: 'executive-summary', component: 'ExecutiveSummaryCard', priority: 1, isExpanded: true },
            { id: 'benchmarking', component: 'IndustryBenchmarking', priority: 2, isExpanded: true, variant: 'detailed' },
            { id: 'enhanced-insights', component: 'EnhancedInsights', priority: 3, isExpanded: true, variant: 'competitive' },
            { id: 'priority-actions', component: 'PriorityActions', priority: 4, isExpanded: false, variant: 'competitive' },
            { id: 'revenue-overview', component: 'RevenueOverview', priority: 5, isExpanded: false },
            { id: 'timeline', component: 'ImplementationTimeline', priority: 6, isExpanded: false }
          ],
          accordionStates: {
            'executive-summary': true,
            'benchmarking': true,
            'enhanced-insights': true,
            'priority-actions': false,
            'revenue-overview': false,
            'timeline': false
          }
        };

      case "plan-implementation":
        return {
          sections: [
            { id: 'executive-summary', component: 'ExecutiveSummaryCard', priority: 1, isExpanded: true },
            { id: 'priority-actions', component: 'PriorityActions', priority: 2, isExpanded: true, variant: 'detailed' },
            { id: 'timeline', component: 'ImplementationTimeline', priority: 3, isExpanded: true, variant: 'detailed' },
            { id: 'enhanced-insights', component: 'EnhancedInsights', priority: 4, isExpanded: true },
            { id: 'benchmarking', component: 'IndustryBenchmarking', priority: 5, isExpanded: false },
            { id: 'revenue-overview', component: 'RevenueOverview', priority: 6, isExpanded: false }
          ],
          accordionStates: {
            'executive-summary': true,
            'priority-actions': true,
            'timeline': true,
            'enhanced-insights': true,
            'benchmarking': false,
            'revenue-overview': false
          }
        };

      default:
        // Default linear flow for exploring or no intent
        return {
          sections: [
            { id: 'executive-summary', component: 'ExecutiveSummaryCard', priority: 1, isExpanded: true },
            { id: 'revenue-overview', component: 'RevenueOverview', priority: 2, isExpanded: false },
            { id: 'enhanced-insights', component: 'EnhancedInsights', priority: 3, isExpanded: false },
            { id: 'benchmarking', component: 'IndustryBenchmarking', priority: 4, isExpanded: false },
            { id: 'priority-actions', component: 'PriorityActions', priority: 5, isExpanded: false },
            { id: 'timeline', component: 'ImplementationTimeline', priority: 6, isExpanded: false }
          ],
          accordionStates: {
            'executive-summary': true,
            'revenue-overview': false,
            'enhanced-insights': false,
            'benchmarking': false,
            'priority-actions': false,
            'timeline': false
          }
        };
    }
  };

  const getEstimatedReadTime = () => {
    switch (userIntent) {
      case "quick-wins": return "5 min";
      case "understand-problem": return "8 min";
      case "compare-competitors": return "10 min";
      case "plan-implementation": return "12 min";
      default: return "15 min";
    }
  };

  const getContentVariant = (sectionId: string) => {
    const config = getContentSequence();
    const section = config.sections.find(s => s.id === sectionId);
    return section?.variant || 'standard';
  };

  const isAccordionExpanded = (sectionId: string) => {
    const config = getContentSequence();
    return config.accordionStates?.[sectionId] ?? false;
  };

  const getSectionPriority = (sectionId: string) => {
    const config = getContentSequence();
    const section = config.sections.find(s => s.id === sectionId);
    return section?.priority || 999;
  };

  return {
    getContentSequence,
    getEstimatedReadTime,
    getContentVariant,
    isAccordionExpanded,
    getSectionPriority
  };
};