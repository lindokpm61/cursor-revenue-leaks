
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  TrendingDown, 
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
    { label: "Revenue Leak Detection", value: 4, prefix: "", suffix: " critical areas", color: "text-destructive" },
    { label: "Industry Loss Benchmark", value: 15, prefix: "", suffix: "% avg bleeding", color: "text-revenue-warning" },
    { label: "Financial Risk Coverage", value: 100, prefix: "", suffix: "% analysis", color: "text-revenue-danger" },
    { label: "Crisis Points Found", value: 12, prefix: "", suffix: "+ bleeding areas", color: "text-destructive" }
  ];

  const industryBenchmarks = [
    { category: "Lead Response", icon: "🩸", insight: "23% revenue bleeding rate" },
    { category: "Payment Recovery", icon: "💔", insight: "8-12% failed collections" },
    { category: "Manual Overhead", icon: "⚠️", insight: "15-25% efficiency loss" }
  ];

  // Animate counter
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % calculatorCapabilities.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Animate loss counter to show money bleeding away
  useEffect(() => {
    const interval = setInterval(() => {
      setLossCounter(prev => prev + 127); // $127 lost every 3 seconds
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
    <div className="relative overflow-hidden bg-gradient-to-br from-background via-destructive/[0.02] to-revenue-warning/[0.03]">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-l from-destructive/5 to-transparent rotate-12 transform"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-revenue-warning/5 to-transparent -rotate-12 transform"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Main content */}
          <div className="space-y-8">
            <div className="space-y-6">
              {/* Pre-headline */}
              <div className="flex items-center gap-3">
                <Badge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Emergency Analysis
                </Badge>
                <Badge className="bg-revenue-warning/10 text-revenue-warning border-revenue-warning/20 hover:bg-revenue-warning/15">
                  <Clock className="h-3 w-3 mr-1" />
                  5-Minute Crisis Assessment
                </Badge>
              </div>

              {/* Main headline */}
              <h1 className="text-hero leading-tight">
                <span className="block text-foreground font-black">Stop Your</span>
                <span className="block bg-gradient-to-r from-destructive via-revenue-warning to-revenue-danger bg-clip-text text-transparent font-black">
                  Revenue Bleeding
                </span>
                <span className="block text-foreground font-black">Right Now</span>
              </h1>

              {/* Subheadline */}
              <p className="text-h3 text-muted-foreground leading-relaxed max-w-xl">
                <span className="font-semibold text-destructive">Your revenue is hemorrhaging</span> through critical gaps 
                in your sales funnel. Find out exactly where the bleeding is worst.
              </p>

              {/* Crisis indicators */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <div className="font-semibold text-destructive">4 Critical Leak Areas</div>
                    <div className="text-small text-muted-foreground">Emergency assessment</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-revenue-warning/5 border border-revenue-warning/20">
                  <div className="p-2 bg-revenue-warning/10 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-revenue-warning" />
                  </div>
                  <div>
                    <div className="font-semibold text-revenue-warning">Time-Critical</div>
                    <div className="text-small text-muted-foreground">Every hour costs money</div>
                  </div>
                </div>
              </div>

              {/* Running loss counter */}
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-destructive/20 rounded-lg">
                    <DollarSign className="h-5 w-5 text-destructive animate-pulse" />
                  </div>
                  <div>
                    <div className="text-sm text-destructive/80">Estimated loss while reading:</div>
                    <div className="text-lg font-bold text-destructive">
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
                className="group bg-gradient-to-r from-destructive via-revenue-warning to-revenue-danger hover:opacity-90 shadow-attention-glow text-h3 font-bold py-6 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl w-full sm:w-auto"
              >
                <Calculator className="h-6 w-6 mr-3 group-hover:rotate-12 transition-transform" />
                Stop the Revenue Bleeding
                <ArrowRight className="h-6 w-6 ml-3 group-hover:translate-x-1 transition-transform" />
              </Button>

              <div className="flex items-center gap-6 text-small text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-revenue-success" />
                  <span>No email required to diagnose</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-revenue-success" />
                  <span>Immediate crisis assessment</span>
                </div>
              </div>
            </div>

            {/* Industry crisis benchmarks */}
            <div className="border-t border-border/50 pt-6">
              <p className="text-small text-muted-foreground mb-4">Industry crisis indicators:</p>
              <div className="grid grid-cols-3 gap-4">
                {industryBenchmarks.map((benchmark, index) => (
                  <div key={index} className="text-center p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <div className="text-2xl mb-1">{benchmark.icon}</div>
                    <div className="text-xs font-medium text-destructive">{benchmark.category}</div>
                    <div className="text-xs text-muted-foreground mt-1">{benchmark.insight}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column - Crisis stats */}
          <div className="space-y-6">
            {/* Main animated stat card */}
            <Card className="border-destructive/30 shadow-xl bg-gradient-to-br from-card via-card to-destructive/5 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-destructive/10 to-revenue-warning/10 rounded-full w-fit mx-auto">
                    <BarChart3 className="h-12 w-12 text-destructive" />
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
                          index === currentStat ? 'bg-destructive' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency process */}
            <Card className="border-destructive/30 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-h3 font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-destructive" />
                  Emergency Assessment
                </h3>
                <div className="space-y-3">
                  {[
                    { step: 1, text: "Identify critical bleeding points", time: "1 min" },
                    { step: 2, text: "Calculate exact loss amounts", time: "30 sec" },
                    { step: 3, text: "Get emergency action plan", time: "instant" }
                  ].map((item) => (
                    <div key={item.step} className="flex items-center gap-4 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                      <div className="w-8 h-8 bg-gradient-to-r from-destructive to-revenue-warning text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <span className="text-body text-foreground">{item.text}</span>
                      </div>
                      <Badge variant="outline" className="text-xs border-destructive/20">
                        {item.time}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Crisis urgency indicators */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-destructive/30">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingDown className="h-5 w-5 text-destructive" />
                    <span className="text-h2 font-bold text-destructive">24/7</span>
                  </div>
                  <p className="text-small text-muted-foreground">Revenue bleeding</p>
                </CardContent>
              </Card>
              
              <Card className="border-destructive/30">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-revenue-warning" />
                    <span className="text-h2 font-bold text-revenue-warning">5min</span>
                  </div>
                  <p className="text-small text-muted-foreground">Crisis diagnosis</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
