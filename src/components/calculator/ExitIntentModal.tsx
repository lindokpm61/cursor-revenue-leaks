import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, Mail, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { saveTemporarySubmission, trackEngagement } from '@/lib/submission';
import { useToast } from '@/hooks/use-toast';

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: number;
  tempId: string | null;
  companyName?: string;
  estimatedLeak?: number;
}

interface OfferConfig {
  title: string;
  subtitle: string;
  benefits: string[];
  ctaText: string;
  emailPlaceholder: string;
  urgencyText: string;
}

const getOfferByStep = (step: number, estimatedLeak?: number): OfferConfig => {
  const leakAmount = estimatedLeak ? `$${Math.round(estimatedLeak).toLocaleString()}` : 'significant revenue';
  
  if (step <= 2) {
    return {
      title: "Don't Miss Your Revenue Leak Analysis!",
      subtitle: "Get a quick estimate of your revenue leaks via email",
      benefits: [
        "Instant leak estimate delivered to your inbox",
        "Industry benchmark comparisons",
        "Quick-win recommendations to start recovering revenue"
      ],
      ctaText: "Get My Quick Analysis",
      emailPlaceholder: "Enter your email for instant analysis",
      urgencyText: "Takes 30 seconds • Join 2,847+ leaders who found hidden revenue"
    };
  }
  
  if (step <= 4) {
    return {
      title: "Save Your Progress & Get Results",
      subtitle: `You're losing ${leakAmount} annually - don't lose your analysis too!`,
      benefits: [
        "Save your current progress automatically",
        "Get notified when your full analysis is ready",
        "Priority access to detailed action plan"
      ],
      ctaText: "Save Progress & Continue",
      emailPlaceholder: "Email to save progress",
      urgencyText: "Your analysis expires in 24 hours without saving"
    };
  }
  
  return {
    title: "Get Your Personalized Action Plan",
    subtitle: `Transform your ${leakAmount} revenue leak into growth`,
    benefits: [
      "Step-by-step recovery roadmap",
      "Priority implementation guide",
      "Follow-up consulting call eligibility"
    ],
    ctaText: "Get My Action Plan",
    emailPlaceholder: "Email for personalized action plan",
    urgencyText: "Limited spots available for priority implementation reviews"
  };
};

export const ExitIntentModal = ({ 
  isOpen, 
  onClose, 
  currentStep, 
  tempId,
  companyName,
  estimatedLeak 
}: ExitIntentModalProps) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const offer = getOfferByStep(currentStep, estimatedLeak);

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Track exit intent capture
      await trackEngagement('exit_intent_capture', {
        step: currentStep,
        email,
        estimated_leak: estimatedLeak,
        company_name: companyName
      });

      // Save temporary submission with email if we have tempId
      if (tempId) {
        await saveTemporarySubmission({
          email,
          temp_id: tempId
        });
      }

      toast({
        title: "Success!",
        description: "We'll send your analysis shortly. Check your email in the next few minutes.",
      });

      onClose();
    } catch (error) {
      console.error('Exit intent capture error:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again or continue with the calculator.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async () => {
    await trackEngagement('exit_intent_dismissed', {
      step: currentStep,
      estimated_leak: estimatedLeak
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto bg-background border border-border shadow-2xl">
        <DialogHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute -top-2 -right-2 h-8 w-8 p-0 hover:bg-muted/50"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle className="text-xl font-bold text-foreground text-center pt-2">
            {offer.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 px-6 pb-6">
          <div className="text-center">
            <p className="text-muted-foreground text-sm leading-relaxed">
              {offer.subtitle}
            </p>
          </div>

          <Card className="border border-primary/20 bg-primary/5 p-4">
            <div className="space-y-3">
              {offer.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                    <TrendingUp className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder={offer.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-background border-input"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
              </div>
            </div>

            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !email}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {offer.ctaText}
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {offer.urgencyText}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};