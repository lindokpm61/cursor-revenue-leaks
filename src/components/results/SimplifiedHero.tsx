
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Target, TrendingDown, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface SimplifiedHeroProps {
  companyName: string;
  totalLeak: number;
  recovery70: number;
  formatCurrency: (amount: number) => string;
  onGetActionPlan: () => void;
  onShowDetails: () => void;
}

export const SimplifiedHero = ({
  companyName,
  totalLeak,
  recovery70,
  formatCurrency,
  onGetActionPlan,
  onShowDetails
}: SimplifiedHeroProps) => {
  const [showQuickInsights, setShowQuickInsights] = useState(false);

  return (
    <div className="max-w-4xl mx-auto text-center space-y-8">
      {/* Main Message */}
      <div className="space-y-4">
        <Badge variant="destructive" className="text-sm px-4 py-2">
          <TrendingDown className="h-4 w-4 mr-2" />
          Revenue Analysis Complete
        </Badge>
        
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          {companyName} is missing
        </h1>
        
        <div className="text-5xl md:text-6xl font-bold text-revenue-danger mb-4">
          {formatCurrency(totalLeak)}
        </div>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          in potential annual revenue. The good news? We've identified exactly how to recover{" "}
          <span className="font-semibold text-revenue-success">
            {formatCurrency(recovery70)}
          </span>{" "}
          of it.
        </p>
      </div>

      {/* Primary Action */}
      <div className="space-y-4">
        <Button 
          onClick={onGetActionPlan}
          size="lg"
          className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-revenue-primary hover:opacity-90 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
        >
          <Target className="h-5 w-5 mr-2" />
          Get My Recovery Plan
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
        
        <p className="text-sm text-muted-foreground">
          Free strategic action plan • Takes 2 minutes
        </p>
      </div>

      {/* Quick Insights Toggle */}
      <div className="pt-4">
        <Button
          variant="ghost"
          onClick={() => setShowQuickInsights(!showQuickInsights)}
          className="text-muted-foreground hover:text-foreground"
        >
          {showQuickInsights ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Hide Quick Insights
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Show Quick Insights
            </>
          )}
        </Button>
      </div>

      {/* Progressive Disclosure - Quick Insights */}
      {showQuickInsights && (
        <Card className="bg-muted/30 border-dashed animate-fade-in">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-revenue-danger mb-1">
                  {Math.round((totalLeak / (totalLeak + recovery70)) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Revenue at Risk</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-revenue-success mb-1">
                  {Math.round((recovery70 / totalLeak) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Recoverable</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary mb-1">
                  3-6
                </div>
                <div className="text-sm text-muted-foreground">Months to Implement</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={onShowDetails}
                className="hover:bg-primary hover:text-primary-foreground"
              >
                View Detailed Analysis
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
