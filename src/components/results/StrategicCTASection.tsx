import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Phone, MessageSquare, Zap, Clock, Users } from "lucide-react";

interface StrategicCTASectionProps {
  totalLeak: number;
  recovery70: number;
  leadScore: number;
  formatCurrency: (amount: number) => string;
}

export const StrategicCTASection = ({ 
  totalLeak, 
  recovery70, 
  leadScore,
  formatCurrency 
}: StrategicCTASectionProps) => {
  const getRecommendedAction = () => {
    if (leadScore >= 80) {
      return "Enterprise Strategy Implementation";
    } else if (leadScore >= 60) {
      return "Guided Strategic Implementation";
    }
    return "Strategic Growth Consultation";
  };

  const getOpportunityMessage = () => {
    if (totalLeak > 500000) {
      return "High-impact opportunity - priority consultation slots available";
    } else if (totalLeak > 100000) {
      return "Schedule your strategy session this week";
    }
    return "Book your strategic consultation today";
  };

  const handleBookConsultation = () => {
    console.log('Book strategy consultation clicked');
    window.open('https://cal.com/rev-calculator/revenuecalculator-strategy-session', '_blank');
  };

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-revenue-growth/10 border-primary/30">
      <CardContent className="p-8">
        <div className="text-center space-y-6">
          <div>
            <Badge variant="outline" className="border-primary text-primary mb-4">
              {getOpportunityMessage()}
            </Badge>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Ready to Capture {formatCurrency(recovery70)}?
            </h3>
            <p className="text-lg text-muted-foreground">
              Book a strategic consultation with our revenue optimization experts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>30-min strategy session</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Expert growth strategist</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Zap className="h-4 w-4" />
              <span>Custom implementation plan</span>
            </div>
          </div>

          <div className="flex justify-center">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 px-8"
              onClick={handleBookConsultation}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Book Strategy Session - Free 30min
            </Button>
          </div>

          <div className="text-center">
            <Badge variant="secondary" className="text-xs">
              Recommended: {getRecommendedAction()}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
