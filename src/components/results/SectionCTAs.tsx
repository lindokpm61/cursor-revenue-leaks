import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Calendar, MessageSquare, Download, Share2 } from "lucide-react";

interface SectionCTAProps {
  type: 'breakdown' | 'benchmarking' | 'actions' | 'timeline';
  totalLeak: number;
  formatCurrency: (amount: number) => string;
}

export const SectionCTA = ({ type, totalLeak, formatCurrency }: SectionCTAProps) => {
  const getCtaContent = () => {
    switch (type) {
      case 'breakdown':
        return {
          title: "Need Help Prioritizing These Losses?",
          description: "Get expert guidance on which revenue leaks to tackle first for maximum impact",
          primaryAction: "Get Implementation Help",
          secondaryAction: "Download Analysis",
          icon: Calendar
        };
      
      case 'benchmarking':
        return {
          title: "Want to Outperform Your Industry?",
          description: "See how top performers in your industry achieve higher conversion rates",
          primaryAction: "See How We Can Help",
          secondaryAction: "Get Benchmark Report",
          icon: ArrowRight
        };
      
      case 'actions':
        return {
          title: "Ready to Execute Your Action Plan?",
          description: "Get expert support to implement these recommendations and start recovering revenue",
          primaryAction: "Schedule Implementation Call",
          secondaryAction: "Export Action Plan",
          icon: Calendar
        };
      
      case 'timeline':
        return {
          title: "Need Expert Timeline Review?",
          description: "Get your implementation timeline reviewed by revenue optimization experts",
          primaryAction: "Get Expert Timeline Review",
          secondaryAction: "Share with Team",
          icon: MessageSquare
        };
      
      default:
        return {
          title: "Need Expert Guidance?",
          description: "Get professional help to maximize your revenue recovery potential",
          primaryAction: "Book Consultation",
          secondaryAction: "Learn More",
          icon: Calendar
        };
    }
  };

  const content = getCtaContent();
  const Icon = content.icon;

  return (
    <Card className="bg-muted/30 border-dashed">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h4 className="font-semibold text-foreground mb-1">{content.title}</h4>
            <p className="text-sm text-muted-foreground">{content.description}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Button size="sm">
              <Icon className="h-4 w-4 mr-2" />
              {content.primaryAction}
            </Button>
            <Button variant="outline" size="sm">
              {type === 'actions' ? <Download className="h-4 w-4 mr-2" /> : 
               type === 'timeline' ? <Share2 className="h-4 w-4 mr-2" /> :
               <MessageSquare className="h-4 w-4 mr-2" />}
              {content.secondaryAction}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};