
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Target, Zap, BarChart3 } from "lucide-react";

interface ScenarioData {
  name: string;
  description: string;
  recoveryRate: number;
  timeframe: string;
  confidence: 'high' | 'medium' | 'low';
  investment: number;
  annualRecovery: number;
  roi: number;
  keyAssumptions: string[];
  riskFactors: string[];
}

interface ActionPlanScenarioPlanningProps {
  baseRecovery: number;
  baseInvestment: number;
  formatCurrency: (amount: number) => string;
}

export const ActionPlanScenarioPlanning = ({
  baseRecovery,
  baseInvestment,
  formatCurrency
}: ActionPlanScenarioPlanningProps) => {
  const [selectedScenario, setSelectedScenario] = useState<string>('conservative');

  const scenarios: Record<string, ScenarioData> = {
    conservative: {
      name: 'Conservative',
      description: 'Focus on quick wins and proven strategies with minimal risk',
      recoveryRate: 0.6,
      timeframe: '6-12 months',
      confidence: 'high',
      investment: baseInvestment * 0.7,
      annualRecovery: baseRecovery * 0.6,
      roi: ((baseRecovery * 0.6 - baseInvestment * 0.7) / (baseInvestment * 0.7)) * 100,
      keyAssumptions: [
        'Team available 50% time for implementation',
        'No major organizational changes required',
        'Existing tools can handle 80% of requirements',
        'Conservative adoption rates (60-70%)'
      ],
      riskFactors: [
        'Lower impact ceiling',
        'Competitor advantage growth',
        'Opportunity cost of not being aggressive'
      ]
    },
    balanced: {
      name: 'Balanced',
      description: 'Optimal mix of quick wins and strategic investments',
      recoveryRate: 0.75,
      timeframe: '8-18 months',
      confidence: 'medium',
      investment: baseInvestment,
      annualRecovery: baseRecovery * 0.75,
      roi: ((baseRecovery * 0.75 - baseInvestment) / baseInvestment) * 100,
      keyAssumptions: [
        'Team available 70% time for implementation',
        'Moderate organizational change management',
        'Mix of existing and new tooling',
        'Realistic adoption rates (75-80%)'
      ],
      riskFactors: [
        'Implementation complexity',
        'Change management challenges',
        'Resource allocation conflicts'
      ]
    },
    aggressive: {
      name: 'Aggressive',
      description: 'Maximum impact through comprehensive transformation',
      recoveryRate: 0.9,
      timeframe: '12-24 months',
      confidence: 'medium',
      investment: baseInvestment * 1.3,
      annualRecovery: baseRecovery * 0.9,
      roi: ((baseRecovery * 0.9 - baseInvestment * 1.3) / (baseInvestment * 1.3)) * 100,
      keyAssumptions: [
        'Dedicated implementation team',
        'Significant organizational transformation',
        'Investment in premium tooling',
        'High adoption rates (85-95%)'
      ],
      riskFactors: [
        'High implementation complexity',
        'Organizational resistance',
        'Technology integration challenges',
        'Extended payback period'
      ]
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScenarioIcon = (scenarioKey: string) => {
    switch (scenarioKey) {
      case 'conservative': return <Target className="h-5 w-5" />;
      case 'balanced': return <BarChart3 className="h-5 w-5" />;
      case 'aggressive': return <Zap className="h-5 w-5" />;
      default: return <TrendingUp className="h-5 w-5" />;
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Scenario Planning & Risk Assessment
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Compare different implementation approaches based on your risk tolerance and resource availability
        </p>
      </CardHeader>

      <CardContent>
        <Tabs value={selectedScenario} onValueChange={setSelectedScenario} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            {Object.entries(scenarios).map(([key, scenario]) => (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                {getScenarioIcon(key)}
                {scenario.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(scenarios).map(([key, scenario]) => (
            <TabsContent key={key} value={key} className="space-y-6">
              {/* Scenario Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">Annual Recovery</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(scenario.annualRecovery)}
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <Target className="h-4 w-4" />
                    <span className="text-sm font-medium">Investment</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatCurrency(scenario.investment)}
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-sm font-medium">ROI</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {Math.round(scenario.roi)}%
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 text-purple-700 mb-2">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm font-medium">Timeframe</span>
                  </div>
                  <p className="text-lg font-bold text-purple-700">
                    {scenario.timeframe}
                  </p>
                  <Badge className={getConfidenceColor(scenario.confidence)} size="sm">
                    {scenario.confidence} confidence
                  </Badge>
                </div>
              </div>

              {/* Scenario Description */}
              <div className="p-4 bg-muted/50 rounded-lg border">
                <h4 className="font-medium text-foreground mb-2">Strategy Overview</h4>
                <p className="text-sm text-muted-foreground">{scenario.description}</p>
              </div>

              {/* Key Assumptions & Risk Factors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-foreground mb-3">Key Assumptions</h4>
                  <ul className="space-y-2">
                    {scenario.keyAssumptions.map((assumption, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                        {assumption}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-3">Risk Factors</h4>
                  <ul className="space-y-2">
                    {scenario.riskFactors.map((risk, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-destructive rounded-full mt-2 flex-shrink-0" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Net Benefit Calculation */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-foreground mb-3">Financial Impact (Year 1)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Gross Recovery</div>
                    <div className="text-lg font-bold text-green-700">
                      {formatCurrency(scenario.annualRecovery)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Investment</div>
                    <div className="text-lg font-bold text-blue-700">
                      {formatCurrency(scenario.investment)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Net Benefit</div>
                    <div className="text-lg font-bold text-primary">
                      {formatCurrency(scenario.annualRecovery - scenario.investment)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Payback</div>
                    <div className="text-lg font-bold text-purple-700">
                      {Math.round((scenario.investment / (scenario.annualRecovery / 12)))} months
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Recommendation */}
        <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <h4 className="font-medium text-primary mb-2">💡 Recommendation</h4>
          <p className="text-sm text-muted-foreground">
            Based on your revenue profile and current maturity, we recommend starting with the{' '}
            <span className="font-medium text-foreground">Balanced</span> approach. 
            This provides optimal risk-adjusted returns while maintaining implementation feasibility.
            You can always accelerate to the Aggressive scenario once initial wins are achieved.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
