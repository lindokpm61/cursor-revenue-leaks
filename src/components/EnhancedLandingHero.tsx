import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Clock, 
  CheckCircle,
  ArrowRight,
  PlayCircle,
  Users,
  BarChart3
} from "lucide-react";

interface EnhancedLandingHeroProps {
  onStartCalculator: () => void;
}

export const EnhancedLandingHero = ({ onStartCalculator }: EnhancedLandingHeroProps) => {
  const [currentStat, setCurrentStat] = useState(0);
  const [animatedValue, setAnimatedValue] = useState(0);

  const impactStats = [
    { label: "Average Revenue Recovery", value: 847000, prefix: "$", suffix: "+", color: "text-revenue-success" },
    { label: "Companies Analyzed", value: 1247, prefix: "", suffix: "+", color: "text-primary" },
    { label: "Avg. Leak Percentage Found", value: 23, prefix: "", suffix: "%", color: "text-revenue-warning" },
    { label: "Implementation Success Rate", value: 94, prefix: "", suffix: "%", color: "text-revenue-success" }
  ];

  const socialProof = [
    { company: "TechCorp", logo: "🚀", result: "Found $1.2M in revenue leaks" },
    { company: "SaaS Solutions", logo: "💡", result: "Improved conversion by 34%" },
    { company: "DataFlow", logo: "📊", result: "Recovered $890K annually" }
  ];

  // Animate counter
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % impactStats.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const targetValue = impactStats[currentStat].value;
    const duration = 1500;
    const steps = 60;
    const increment = targetValue / steps;
    let current = 0;
    let stepCount = 0;

    const animate = () => {
      if (stepCount < steps) {
        current += increment;
        setAnimatedValue(Math.floor(current));
        stepCount++;
        requestAnimationFrame(animate);
      } else {
        setAnimatedValue(targetValue);
      }
    };

    animate();
  }, [currentStat]);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-background via-primary/[0.02] to-accent/[0.03]">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-l from-primary/5 to-transparent rotate-12 transform"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-accent/5 to-transparent -rotate-12 transform"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Main content */}
          <div className="space-y-8">
            <div className="space-y-6">
              {/* Pre-headline */}
              <div className="flex items-center gap-3">
                <Badge className="bg-revenue-success/10 text-revenue-success border-revenue-success/20 hover:bg-revenue-success/15">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Free Tool
                </Badge>
                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                  <Clock className="h-3 w-3 mr-1" />
                  5-Minute Analysis
                </Badge>
              </div>

              {/* Main headline */}
              <h1 className="text-hero leading-tight">
                <span className="block text-foreground font-black">Find Your</span>
                <span className="block bg-gradient-to-r from-revenue-danger via-revenue-warning to-revenue-primary bg-clip-text text-transparent font-black">
                  Hidden Revenue Leaks
                </span>
                <span className="block text-foreground font-black">in Minutes</span>
              </h1>

              {/* Subheadline */}
              <p className="text-h3 text-muted-foreground leading-relaxed max-w-xl">
                <span className="font-semibold text-foreground">Our AI-powered calculator</span> analyzes your entire sales funnel 
                to identify exactly where you're losing revenue — and how to fix it.
              </p>

              {/* Value propositions */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50">
                  <div className="p-2 bg-revenue-success/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-revenue-success" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Average Recovery</div>
                    <div className="text-small text-muted-foreground">$847K+ annually</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Precision Analysis</div>
                    <div className="text-small text-muted-foreground">Pinpoint leak sources</div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="space-y-4">
              <Button
                onClick={onStartCalculator}
                className="group bg-gradient-to-r from-primary via-revenue-primary to-accent hover:opacity-90 shadow-attention-glow text-h3 font-bold py-6 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl w-full sm:w-auto"
              >
                <Calculator className="h-6 w-6 mr-3 group-hover:rotate-12 transition-transform" />
                Start Free Analysis Now
                <ArrowRight className="h-6 w-6 ml-3 group-hover:translate-x-1 transition-transform" />
              </Button>

              <div className="flex items-center gap-6 text-small text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-revenue-success" />
                  <span>No email required to start</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-revenue-success" />
                  <span>Instant results</span>
                </div>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="border-t border-border/50 pt-6">
              <p className="text-small text-muted-foreground mb-4">Trusted by growing SaaS companies:</p>
              <div className="grid grid-cols-3 gap-4">
                {socialProof.map((proof, index) => (
                  <div key={index} className="text-center p-3 rounded-lg bg-muted/30 border border-border/30">
                    <div className="text-2xl mb-1">{proof.logo}</div>
                    <div className="text-xs font-medium text-foreground">{proof.company}</div>
                    <div className="text-xs text-muted-foreground mt-1">{proof.result}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column - Interactive stats */}
          <div className="space-y-6">
            {/* Main animated stat card */}
            <Card className="border-border/30 shadow-xl bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full w-fit mx-auto">
                    <BarChart3 className="h-12 w-12 text-primary" />
                  </div>
                  
                  <div>
                    <div className="text-small text-muted-foreground mb-2">
                      {impactStats[currentStat].label}
                    </div>
                    <div className={`text-4xl font-black ${impactStats[currentStat].color}`}>
                      {impactStats[currentStat].prefix}
                      {animatedValue.toLocaleString()}
                      {impactStats[currentStat].suffix}
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-2 pt-4">
                    {impactStats.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentStat ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How it works preview */}
            <Card className="border-border/30 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-h3 font-semibold text-foreground mb-4 flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-primary" />
                  How It Works
                </h3>
                <div className="space-y-3">
                  {[
                    { step: 1, text: "Enter your company metrics", time: "1 min" },
                    { step: 2, text: "AI analyzes your funnel", time: "30 sec" },
                    { step: 3, text: "Get actionable insights", time: "instant" }
                  ].map((item) => (
                    <div key={item.step} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20">
                      <div className="w-8 h-8 bg-gradient-to-r from-primary to-revenue-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <span className="text-body text-foreground">{item.text}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.time}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Social proof numbers */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-border/30">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-h2 font-bold text-primary">1,247+</span>
                  </div>
                  <p className="text-small text-muted-foreground">Companies analyzed</p>
                </CardContent>
              </Card>
              
              <Card className="border-border/30">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-revenue-success" />
                    <span className="text-h2 font-bold text-revenue-success">$24M+</span>
                  </div>
                  <p className="text-small text-muted-foreground">Revenue recovered</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};