
import { useState } from "react";
import { RevenueCalculator } from "@/components/RevenueCalculator";
import { CalculatorErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  TrendingUp, 
  Users, 
  Shield, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  BarChart3, 
  Zap, 
  Award,
  PlayCircle,
  Target,
  DollarSign
} from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const [showCalculator, setShowCalculator] = useState(false);

  if (showCalculator) {
    return (
      <div className="min-h-screen bg-background">
        <CalculatorErrorBoundary>
          <RevenueCalculator />
        </CalculatorErrorBoundary>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to main content - Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>

      {/* Navigation */}
      <nav className="border-b border-border/50" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg bg-gradient-to-r from-primary to-revenue-primary"
                aria-hidden="true"
              >
                <Calculator className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-h2 font-bold">Revenue Leak Calculator</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" aria-label="Login to your account">
                  Login
                </Button>
              </Link>
              <Button 
                onClick={() => setShowCalculator(true)}
                className="bg-gradient-to-r from-primary to-revenue-primary touch-target"
                aria-label="Start the revenue calculator assessment"
              >
                Start Calculator
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <main id="main-content">
        <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/[0.02] to-accent/[0.03] py-20 px-4">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-l from-primary/5 to-transparent rotate-12 transform"></div>
            <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-accent/5 to-transparent -rotate-12 transform"></div>
          </div>

          <div className="relative max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left column - Main content */}
              <div className="space-y-8">
                {/* Pre-headline badges */}
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-revenue-success/10 text-revenue-success border-revenue-success/20 hover:bg-revenue-success/15">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    100% Free Tool
                  </Badge>
                  <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                    <Clock className="h-3 w-3 mr-1" />
                    5-Minute Analysis
                  </Badge>
                  <Badge className="bg-revenue-warning/10 text-revenue-warning border-revenue-warning/20 hover:bg-revenue-warning/15">
                    <Award className="h-3 w-3 mr-1" />
                    Research-Backed
                  </Badge>
                </div>

                {/* Main headline */}
                <div>
                  <h1 className="text-hero leading-tight mb-6">
                    <span className="block text-foreground font-black">Find Your</span>
                    <span className="block bg-gradient-to-r from-revenue-danger via-revenue-warning to-revenue-primary bg-clip-text text-transparent font-black">
                      Hidden Revenue Leaks
                    </span>
                    <span className="block text-foreground font-black">in Minutes</span>
                  </h1>
                  
                  <p className="text-h3 text-muted-foreground leading-relaxed max-w-xl mb-8">
                    <span className="font-semibold text-foreground">Our AI-powered calculator</span> analyzes your entire sales funnel 
                    to identify exactly where you're losing revenue — and how to fix it.
                  </p>
                  
                  {/* Urgency & Value Proposition */}
                  <div className="bg-gradient-to-r from-revenue-warning/10 to-revenue-danger/10 border border-revenue-warning/20 rounded-lg p-4 mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Zap className="h-5 w-5 text-revenue-warning" aria-hidden="true" />
                      <span className="font-semibold text-foreground">Industry Research Shows:</span>
                    </div>
                    <p className="text-body text-muted-foreground text-center">
                      SaaS companies typically lose <strong className="text-revenue-danger">15-30% of potential revenue</strong> 
                      through preventable operational gaps
                    </p>
                  </div>
                </div>

                {/* CTA Section */}
                <div className="space-y-4">
                  <Button
                    onClick={() => setShowCalculator(true)}
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
              </div>

              {/* Right column - Interactive preview */}
              <div className="space-y-6">
                {/* How it works card */}
                <Card className="border-border/30 shadow-xl bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <h3 className="text-h2 font-semibold text-foreground mb-6 flex items-center gap-2">
                      <PlayCircle className="h-6 w-6 text-primary" />
                      How It Works
                    </h3>
                    <div className="space-y-4">
                      {[
                        { step: 1, text: "Enter your company metrics", time: "1 min", icon: BarChart3 },
                        { step: 2, text: "AI analyzes your funnel", time: "30 sec", icon: Target },
                        { step: 3, text: "Get actionable insights", time: "instant", icon: Zap }
                      ].map((item) => {
                        const StepIcon = item.icon;
                        return (
                          <div key={item.step} className="flex items-center gap-4 p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                            <div className="w-10 h-10 bg-gradient-to-r from-primary to-revenue-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                              {item.step}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <StepIcon className="h-4 w-4 text-primary" />
                                <span className="text-body text-foreground font-medium">{item.text}</span>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {item.time}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Industry benchmarks grid */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-border/30">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <span className="text-h2 font-bold text-primary">100%</span>
                      </div>
                      <p className="text-small text-muted-foreground">Free analysis</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-border/30">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-revenue-success" />
                        <span className="text-h2 font-bold text-revenue-success">5min</span>
                      </div>
                      <p className="text-small text-muted-foreground">Complete assessment</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-h1 mb-4">Why Revenue Leaks Cost You Millions</h2>
              <p className="text-h3 text-muted-foreground max-w-3xl mx-auto">
                Most SaaS companies lose 15-30% of potential revenue through preventable leaks. 
                Our calculator identifies the four critical areas where money slips through the cracks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <TrendingUp className="h-10 w-10 text-revenue-warning mb-4" />
                  <CardTitle>Lead Response Loss</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Slow lead response times cost the average SaaS company $2.4M annually. 
                    Calculate your exact loss based on response time metrics.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <Shield className="h-10 w-10 text-revenue-danger mb-4" />
                  <CardTitle>Failed Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Payment failures affect 3-7% of SaaS transactions. Poor dunning management 
                    turns temporary issues into permanent churn.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <Users className="h-10 w-10 text-revenue-primary mb-4" />
                  <CardTitle>Self-Serve Gap</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    The gap between your free-to-paid conversion rate and the 15% benchmark 
                    represents massive untapped revenue potential.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <Calculator className="h-10 w-10 text-revenue-success mb-4" />
                  <CardTitle>Process Inefficiency</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Manual processes and operational inefficiencies create hidden costs. 
                    Measure the true impact on your bottom line.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-20 px-4" aria-labelledby="social-proof-heading">
          <div className="max-w-7xl mx-auto text-center">
            <h2 id="social-proof-heading" className="text-h1 mb-4">
              Research-Backed Revenue Analytics
            </h2>
            <p className="text-h3 text-muted-foreground max-w-3xl mx-auto mb-16">
              Our methodology is validated by industry research and proven benchmarks
            </p>

            {/* Industry benchmarks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <Card className="border-border/50 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="text-h1 font-bold text-revenue-primary mb-2">200+</div>
                  <div className="text-body text-muted-foreground mb-4">SaaS Companies Analyzed</div>
                  <p className="text-small text-muted-foreground">
                    Our calculations are based on real performance data from over 200 SaaS companies.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-border/50 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="text-h1 font-bold text-revenue-success mb-2">15-30%</div>
                  <div className="text-body text-muted-foreground mb-4">Typical Revenue Recovery</div>
                  <p className="text-small text-muted-foreground">
                    Industry studies show most SaaS companies lose this much through preventable gaps.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="text-h1 font-bold text-revenue-warning mb-2">4</div>
                  <div className="text-body text-muted-foreground mb-4">Critical Leak Categories</div>
                  <p className="text-small text-muted-foreground">
                    Based on Harvard Business Review research on primary revenue leakage areas.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-primary/10 to-revenue-primary/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-h1 mb-6">
              Ready to Discover Your Hidden Revenue?
            </h2>
            <p className="text-h3 text-muted-foreground mb-8">
              It takes less than 5 minutes to complete the assessment and see your personalized results.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                onClick={() => setShowCalculator(true)}
                size="lg" 
                className="bg-gradient-to-r from-primary to-revenue-primary text-h3 px-8 py-4 hover:opacity-90 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Start Your Free Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Benefits checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
              {[
                'Identify exact revenue leak amounts',
                'Get personalized recovery recommendations', 
                'Benchmark against industry standards',
                'Receive detailed ROI projections'
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-revenue-success" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-revenue-primary">
                <Calculator className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-h2 font-bold">Revenue Leak Calculator</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/login" className="hover:text-foreground transition-colors">Login</Link>
              <Link to="/register" className="hover:text-foreground transition-colors">Register</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border/30 text-center text-sm text-muted-foreground">
            © 2024 Revenue Leak Calculator. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
