
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  TrendingDown, 
  TrendingUp,
  DollarSign, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  ArrowRight,
  PlayCircle,
  Users,
  BarChart3,
  Zap
} from "lucide-react";

interface EnhancedLandingHeroProps {
  onStartCalculator: () => void;
}

export const EnhancedLandingHero = ({ onStartCalculator }: EnhancedLandingHeroProps) => {
  const [currentStat, setCurrentStat] = useState(0);
  const [animatedValue, setAnimatedValue] = useState(0);
  const [lossCounter, setLossCounter] = useState(0);

  const calculatorCapabilities = [
    { label: "Revenue Opportunity Detection", value: 4, prefix: "", suffix: " growth areas", color: "text-primary" },
    { label: "Industry Growth Benchmark", value: 15, prefix: "", suffix: "% avg opportunity", color: "text-revenue-growth" },
    { label: "Strategic Analysis Coverage", value: 100, prefix: "", suffix: "% comprehensive", color: "text-revenue-primary" },
    { label: "Growth Areas Identified", value: 12, prefix: "", suffix: "+ optimization points", color: "text-primary" }
  ];

  const industryBenchmarks = [
    { category: "Lead Response", icon: "🎯", insight: "23% growth opportunity" },
    { category: "Payment Recovery", icon: "💰", insight: "8-12% revenue potential" },
    { category: "Process Efficiency", icon: "⚡", insight: "15-25% optimization gains" }
  ];

  // Animate counter
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % calculatorCapabilities.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Animate opportunity counter to show potential revenue growth
  useEffect(() => {
    const interval = setInterval(() => {
      setLossCounter(prev => prev + 127); // $127 opportunity every 3 seconds
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const targetValue = calculatorCapabilities[currentStat].value;
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
    <div className="relative overflow-hidden bg-gradient-to-br from-background via-primary/[0.02] to-revenue-growth/[0.03]">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-l from-primary/5 to-transparent rotate-12 transform"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-revenue-growth/5 to-transparent -rotate-12 transform"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Main content */}
          <div className="space-y-8">
            <div className="space-y-6">
              {/* Pre-headline */}
              <div className="flex items-center gap-3">
                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Strategic Analysis
                </Badge>
                <Badge className="bg-revenue-growth/10 text-revenue-growth border-revenue-growth/20 hover:bg-revenue-growth/15">
                  <Clock className="h-3 w-3 mr-1" />
                  5-Minute Assessment
                </Badge>
              </div>

              {/* Main headline */}
              <h1 className="text-hero leading-tight">
                <span className="block text-foreground font-black">Unlock Your</span>
                <span className="block bg-gradient-to-r from-primary via-revenue-growth to-revenue-primary bg-clip-text text-transparent font-black">
                  Revenue Potential
                </span>
                <span className="block text-foreground font-black">In 5 Minutes</span>
              </h1>

              {/* Subheadline */}
              <p className="text-h3 text-muted-foreground leading-relaxed max-w-xl">
                <span className="font-semibold text-primary">Discover untapped revenue opportunities</span> hidden in your sales funnel. 
                Find out exactly where your biggest growth potential lies.
              </p>

              {/* Strategic indicators */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-primary">4 Growth Opportunity Areas</div>
                    <div className="text-small text-muted-foreground">Strategic assessment</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-revenue-growth/5 border border-revenue-growth/20">
                  <div className="p-2 bg-revenue-growth/10 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-revenue-growth" />
                  </div>
                  <div>
                    <div className="font-semibold text-revenue-growth">Revenue Optimization</div>
                    <div className="text-small text-muted-foreground">Maximize your potential</div>
                  </div>
                </div>
              </div>

              {/* Running opportunity counter */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <DollarSign className="h-5 w-5 text-primary animate-pulse" />
                  </div>
                  <div>
                    <div className="text-sm text-primary/80">Revenue opportunity growing:</div>
                    <div className="text-lg font-bold text-primary">
                      ${lossCounter.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="space-y-4">
              <Button
                onClick={onStartCalculator}
                className="group bg-gradient-to-r from-primary via-revenue-growth to-revenue-primary hover:opacity-90 shadow-attention-glow text-h3 font-bold py-6 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl w-full sm:w-auto"
              >
                <Calculator className="h-6 w-6 mr-3 group-hover:rotate-12 transition-transform" />
                Discover Your Revenue Potential
                <ArrowRight className="h-6 w-6 ml-3 group-hover:translate-x-1 transition-transform" />
              </Button>

              <div className="flex items-center gap-6 text-small text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-revenue-success" />
                  <span>No email required to start</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-revenue-success" />
                  <span>Instant strategic insights</span>
                </div>
              </div>
            </div>

            {/* Industry opportunity benchmarks */}
            <div className="border-t border-border/50 pt-6">
              <p className="text-small text-muted-foreground mb-4">Industry growth indicators:</p>
              <div className="grid grid-cols-3 gap-4">
                {industryBenchmarks.map((benchmark, index) => (
                  <div key={index} className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="text-2xl mb-1">{benchmark.icon}</div>
                    <div className="text-xs font-medium text-primary">{benchmark.category}</div>
                    <div className="text-xs text-muted-foreground mt-1">{benchmark.insight}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column - Growth stats */}
          <div className="space-y-6">
            {/* Main animated stat card */}
            <Card className="border-primary/30 shadow-xl bg-gradient-to-br from-card via-card to-primary/5 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-revenue-growth/10 rounded-full w-fit mx-auto">
                    <BarChart3 className="h-12 w-12 text-primary" />
                  </div>
                  
                  <div>
                    <div className="text-small text-muted-foreground mb-2">
                      {calculatorCapabilities[currentStat].label}
                    </div>
                    <div className={`text-4xl font-black ${calculatorCapabilities[currentStat].color}`}>
                      {calculatorCapabilities[currentStat].prefix}
                      {animatedValue.toLocaleString()}
                      {calculatorCapabilities[currentStat].suffix}
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-2 pt-4">
                    {calculatorCapabilities.map((_, index) => (
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

            {/* Strategic process */}
            <Card className="border-primary/30 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-h3 font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Strategic Assessment
                </h3>
                <div className="space-y-3">
                  {[
                    { step: 1, text: "Identify growth opportunities", time: "1 min" },
                    { step: 2, text: "Calculate revenue potential", time: "30 sec" },
                    { step: 3, text: "Get strategic action plan", time: "instant" }
                  ].map((item) => (
                    <div key={item.step} className="flex items-center gap-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="w-8 h-8 bg-gradient-to-r from-primary to-revenue-growth text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <span className="text-body text-foreground">{item.text}</span>
                      </div>
                      <Badge variant="outline" className="text-xs border-primary/20">
                        {item.time}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Strategic opportunity indicators */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-primary/30">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="text-h2 font-bold text-primary">24/7</span>
                  </div>
                  <p className="text-small text-muted-foreground">Revenue optimization</p>
                </CardContent>
              </Card>
              
              <Card className="border-primary/30">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-revenue-growth" />
                    <span className="text-h2 font-bold text-revenue-growth">5min</span>
                  </div>
                  <p className="text-small text-muted-foreground">Strategic analysis</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
