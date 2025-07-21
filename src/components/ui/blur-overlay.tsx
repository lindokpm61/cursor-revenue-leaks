
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Unlock, ArrowRight } from "lucide-react";
import { ReactNode } from "react";

interface BlurOverlayProps {
  children: ReactNode;
  title?: string;
  description?: string;
  ctaText?: string;
  onUnlock?: () => void;
  blurLevel?: 'light' | 'medium' | 'heavy';
}

export const BlurOverlay = ({ 
  children, 
  title = "Unlock Strategic Details",
  description = "Get complete implementation guide in your strategy consultation",
  ctaText = "Book Strategy Session",
  onUnlock,
  blurLevel = 'medium'
}: BlurOverlayProps) => {
  const blurClasses = {
    light: 'blur-sm',
    medium: 'blur-md',
    heavy: 'blur-lg'
  };

  return (
    <div className="relative">
      <div className={`${blurClasses[blurLevel]} pointer-events-none`}>
        {children}
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/60 flex items-center justify-center">
        <Card className="max-w-md mx-4 bg-background/95 backdrop-blur-sm border-primary/20 shadow-xl">
          <CardContent className="p-6 text-center">
            <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-4">
              <Unlock className="h-6 w-6 text-primary" />
            </div>
            
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {title}
            </h3>
            
            <p className="text-sm text-muted-foreground mb-4">
              {description}
            </p>
            
            <Button 
              onClick={onUnlock || (() => window.open('https://calendly.com/strategy-session', '_blank'))}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {ctaText}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
