import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Phone, X, MessageSquare } from "lucide-react";

interface FloatingCTABarProps {
  totalLeak: number;
  formatCurrency: (amount: number) => string;
}

export const FloatingCTABar = ({ totalLeak, formatCurrency }: FloatingCTABarProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Show after user scrolls down 50% of viewport height
      setIsVisible(scrollPosition > windowHeight * 0.5);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                <span className="text-sm font-medium text-foreground">
                  💰 Recovery Opportunity: {formatCurrency(totalLeak)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Ready to start recovering revenue?
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button size="sm" className="flex-1 sm:flex-none">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Expert Call
                </Button>
                <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                  <Phone className="h-4 w-4 mr-2" />
                  Talk to Expert
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 sm:flex-none">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Get Quote
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDismissed(true)}
              className="ml-2 p-1 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};