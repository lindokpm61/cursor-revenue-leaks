
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Calendar, Phone, Mail, X, CheckCircle } from "lucide-react";

interface ActionPlanExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  recoveryAmount: number;
  formatCurrency: (amount: number) => string;
  onEmailSubmit?: (email: string) => void;
  checkedActionsCount?: number;
  topPriorityAction?: string;
}

export const ActionPlanExitIntentModal = ({
  isOpen,
  onClose,
  recoveryAmount,
  formatCurrency,
  onEmailSubmit,
  checkedActionsCount = 0,
  topPriorityAction
}: ActionPlanExitIntentModalProps) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onEmailSubmit?.(email);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting email:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPersonalizedMessage = () => {
    if (checkedActionsCount >= 3) {
      return `You've identified ${checkedActionsCount} priority actions. Let us help you implement them effectively.`;
    } else if (topPriorityAction) {
      return `Focusing on ${topPriorityAction}? We can help you get started immediately.`;
    } else {
      return "Ready to turn your action plan into results?";
    }
  };

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold">Thank You!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                We'll send you a personalized implementation guide within 24 hours.
              </p>
            </div>
            <Button onClick={onClose} className="w-full">
              Continue Reviewing Action Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Don't Miss This Opportunity
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {formatCurrency(recoveryAmount)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Annual Revenue Recovery Potential
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center space-y-2">
            <p className="font-medium">{getPersonalizedMessage()}</p>
            <p className="text-sm text-muted-foreground">
              Get a personalized implementation roadmap delivered to your inbox.
            </p>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button 
                type="submit" 
                disabled={isSubmitting || !email}
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                {isSubmitting ? "Sending..." : "Get Implementation Guide"}
              </Button>
              
              <Button variant="outline" className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Book Strategy Call
              </Button>
            </div>
          </form>

          <div className="text-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              Continue without saving
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
