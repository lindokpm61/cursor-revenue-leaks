import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { X, Mail, TrendingUp, Shield, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveTemporarySubmission } from "@/lib/submission/submissionStorage";
import { trackEngagement } from "@/lib/submission/engagementTracking";

interface ProgressiveEmailCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
  currentStep: number;
  tempId: string | null;
  trigger: 'step_completion' | 'time_based' | 'exit_intent' | 'value_reveal';
  context?: {
    companyName?: string;
    estimatedValue?: number;
    stepData?: any;
  };
}

interface CaptureConfig {
  title: string;
  subtitle: string;
  benefits: string[];
  ctaText: string;
  motivation: string;
  urgency?: string;
}

const getCaptureConfig = (step: number, trigger: string, context?: any): CaptureConfig => {
  const formatValue = (value: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      minimumFractionDigits: 0,
      notation: value >= 1000000 ? 'compact' : 'standard'
    }).format(value);

  switch (trigger) {
    case 'step_completion':
      if (step === 2) {
        return {
          title: "Great Progress! 🎯",
          subtitle: "Lead analysis shows potential revenue gaps",
          benefits: [
            "Save your progress automatically",
            "Get preliminary revenue leak insights", 
            "Access step-by-step improvement guide"
          ],
          ctaText: "Continue My Analysis",
          motivation: "Continue your revenue analysis and unlock insights tailored to your lead generation process."
        };
      } else if (step === 3) {
        return {
          title: "Almost There! 💪",
          subtitle: "Self-serve conversion gaps identified",
          benefits: [
            "Secure your analysis progress",
            "Get conversion optimization tips",
            "Receive benchmark comparisons"
          ],
          ctaText: "Secure My Analysis",
          motivation: "Your free-to-paid conversion data reveals important optimization opportunities."
        };
      }
      break;

    case 'value_reveal':
      return {
        title: `${formatValue(context?.estimatedValue || 0)} Revenue Opportunity Detected! 🚀`,
        subtitle: "Secure your personalized recovery plan",
        benefits: [
          "Download detailed implementation roadmap",
          "Get priority action checklist",
          "Access monthly progress tracking"
        ],
        ctaText: "Claim My Recovery Plan",
        motivation: "This analysis is customized for your business. Secure access to your complete results.",
        urgency: "Limited time: Get your full analysis report"
      };

    case 'time_based':
      return {
        title: "Don't Lose Your Progress ⏰",
        subtitle: "5 minutes invested, insights almost ready",
        benefits: [
          "Resume exactly where you left off",
          "Get progress recap via email",
          "Unlock partial insights now"
        ],
        ctaText: "Save My Progress",
        motivation: "Secure your calculator progress and get preliminary insights while you complete the analysis."
      };

    case 'exit_intent':
    default:
      return {
        title: "Wait! Don't Miss Your Revenue Analysis 💡",
        subtitle: "You're 60% through discovering revenue opportunities",
        benefits: [
          "Complete your analysis later",
          "Get partial insights now",
          "No commitment required"
        ],
        ctaText: "Email My Progress",
        motivation: "Get your preliminary findings and a link to complete your analysis anytime.",
        urgency: "Takes 30 seconds - no spam, just value"
      };
  }

  return {
    title: "Secure Your Revenue Analysis",
    subtitle: "Continue your optimization journey",
    benefits: [
      "Save your progress",
      "Get personalized insights",
      "Access improvement recommendations"
    ],
    ctaText: "Continue Analysis",
    motivation: "Secure your revenue optimization analysis and unlock personalized recommendations."
  };
};

export const ProgressiveEmailCapture = ({
  isOpen,
  onClose,
  onSuccess,
  currentStep,
  tempId,
  trigger,
  context
}: ProgressiveEmailCaptureProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const config = getCaptureConfig(currentStep, trigger, context);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Track the email capture event
      await trackEngagement('email_capture', {
        trigger,
        step: currentStep,
        email_provided: true
      });

      // Save email to temporary submission
      if (tempId) {
        await saveTemporarySubmission({
          temp_id: tempId,
          email,
          email_engagement_score: 10, // Initial engagement score
          last_email_sent_at: new Date().toISOString(),
          email_sequences_triggered: [trigger]
        });
      }

      toast({
        title: "Email Saved Successfully! ✅",
        description: "Your progress is secure and insights are on the way.",
      });

      onSuccess(email);
      onClose();
    } catch (error) {
      console.error('Error capturing email:', error);
      toast({
        title: "Error",
        description: "Failed to save email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    try {
      await trackEngagement('email_capture_dismissed', {
        trigger,
        step: currentStep,
        email_provided: false
      });
    } catch (error) {
      console.error('Error tracking dismissal:', error);
    }
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      trackEngagement('email_capture_shown', {
        trigger,
        step: currentStep
      });
    }
  }, [isOpen, trigger, currentStep]);

  const getIcon = () => {
    switch (trigger) {
      case 'value_reveal':
        return <TrendingUp className="h-6 w-6 text-primary-foreground" />;
      case 'step_completion':
        return <Lightbulb className="h-6 w-6 text-primary-foreground" />;
      case 'time_based':
      case 'exit_intent':
      default:
        return <Mail className="h-6 w-6 text-primary-foreground" />;
    }
  };

  const getGradient = () => {
    switch (trigger) {
      case 'value_reveal':
        return "from-revenue-success to-primary";
      case 'step_completion':
        return "from-primary to-revenue-primary";
      case 'time_based':
        return "from-orange-500 to-primary";
      case 'exit_intent':
      default:
        return "from-primary to-secondary";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto" aria-describedby="email-capture-description">
        <div className="absolute right-4 top-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-6 w-6 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <DialogHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-r ${getGradient()}`}>
              {getIcon()}
            </div>
          </div>
          <DialogTitle className="text-xl font-bold leading-tight">
            {config.title}
          </DialogTitle>
          <p id="email-capture-description" className="text-sm text-muted-foreground mt-2">
            {config.subtitle}
          </p>
        </DialogHeader>

        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 mb-4">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-3 text-center">
              {config.motivation}
            </p>
            
            <div className="space-y-2">
              {config.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-foreground text-[10px]">✓</span>
                  </div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            {config.urgency && (
              <div className="mt-3 p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                    {config.urgency}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="progressive-email">Business Email Address</Label>
            <Input
              id="progressive-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@company.com"
              required
              autoFocus
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
            size="lg"
          >
            {loading ? "Securing..." : config.ctaText}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            No spam. Unsubscribe anytime. We respect your privacy.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};