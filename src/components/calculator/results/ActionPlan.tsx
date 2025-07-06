import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import { Calculations } from "../useCalculatorData";

interface ActionPlanProps {
  calculations: Calculations;
}

export const ActionPlan = ({ calculations }: ActionPlanProps) => {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Recommended Action Plan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Quick Wins (0-30 days)</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Implement automated lead response system</li>
              <li>• Set up failed payment recovery workflows</li>
              <li>• Review and optimize onboarding flow</li>
              <li>• Automate most time-consuming manual tasks</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Long-term Impact (3-6 months)</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Advanced lead scoring and qualification</li>
              <li>• Predictive churn prevention</li>
              <li>• Self-serve optimization program</li>
              <li>• Complete process automation suite</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-background rounded-lg border">
          <p className="text-sm font-medium text-foreground mb-2">
            💡 Priority Focus: {
              calculations.leadResponseLoss > calculations.failedPaymentLoss && 
              calculations.leadResponseLoss > calculations.selfServeGap && 
              calculations.leadResponseLoss > calculations.processLoss
                ? "Lead Response Optimization"
                : calculations.failedPaymentLoss > calculations.selfServeGap && 
                  calculations.failedPaymentLoss > calculations.processLoss
                ? "Payment Recovery Systems"
                : calculations.selfServeGap > calculations.processLoss
                ? "Self-Serve Conversion"
                : "Process Automation"
            }
          </p>
          <p className="text-xs text-muted-foreground">
            This area represents your largest revenue leak and should be addressed first for maximum impact.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};