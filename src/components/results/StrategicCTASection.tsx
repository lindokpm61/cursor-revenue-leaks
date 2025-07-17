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
  const getUrgencyMessage = () => {
    if (totalLeak > 500000) {
      return "High-priority case - limited expert slots available";
    } else if (totalLeak > 100000) {
      return "Book your strategy session this week";
    }
    return "Schedule your consultation today";
  };

  const getRecommendedAction = () => {
    if (leadScore >= 80) {
      return "Enterprise Implementation";
    } else if (leadScore >= 60) {
      return "Guided Implementation";
    }
    return "Strategic Consultation";
  };

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-revenue-primary/10 border-primary/30">
      <CardContent className="p-8">
        <div className="text-center space-y-6">
          <div>
            <Badge variant="outline" className="border-primary text-primary mb-4">
              {getUrgencyMessage()}
            </Badge>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Ready to Recover {formatCurrency(recovery70)}?
            </h3>
            <p className="text-lg text-muted-foreground">
              Book a free strategy session with our revenue optimization experts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>30-min consultation</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Expert revenue strategist</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Zap className="h-4 w-4" />
              <span>Customized action plan</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Button size="lg" className="flex-1">
              <Calendar className="h-4 w-4 mr-2" />
              Book Expert Consultation
            </Button>
            <Button variant="outline" size="lg" className="flex-1">
              <Phone className="h-4 w-4 mr-2" />
              Call Now
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