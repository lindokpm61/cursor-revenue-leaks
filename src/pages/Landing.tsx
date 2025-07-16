import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, TrendingUp, Users, Shield, ArrowRight, CheckCircle, Star, Quote } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-revenue-primary">
                <Calculator className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-h2 font-bold">Revenue Leak Calculator</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/calculator">
                <Button className="bg-gradient-to-r from-primary to-revenue-primary">
                  Start Calculator
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-hero font-bold mb-6">
              <span className="bg-gradient-to-r from-primary to-revenue-primary bg-clip-text text-transparent">
                Identify & Quantify
              </span>
              <br />
              Your SaaS Revenue Leaks
            </h1>
            <p className="text-h3 text-muted-foreground max-w-3xl mx-auto mb-8">
              Discover hidden revenue opportunities in your sales funnel. Our enterprise-grade calculator 
              analyzes lead response times, payment failures, conversion gaps, and operational inefficiencies 
              to show you exactly how much revenue you're losing.
            </p>
            <div className="flex justify-center">
              <Link to="/calculator">
                <Button size="lg" className="bg-gradient-to-r from-primary to-revenue-primary text-h3 px-8 py-4">
                  Calculate Your Revenue Leaks
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Industry Benchmarks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border-border/50 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-h1 font-bold text-revenue-success mb-2">110%</div>
                <div className="text-small text-muted-foreground">Average Net Revenue Retention</div>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-h1 font-bold text-revenue-primary mb-2">78%</div>
                <div className="text-small text-muted-foreground">Typical Gross Margin</div>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-h1 font-bold text-revenue-warning mb-2">32%</div>
                <div className="text-small text-muted-foreground">Annual Growth Rate</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-h1 font-bold mb-4">Why Revenue Leaks Cost You Millions</h2>
            <p className="text-h3 text-muted-foreground max-w-3xl mx-auto">
              Most SaaS companies lose 15-30% of potential revenue through preventable leaks. 
              Our calculator identifies the four critical areas where money slips through the cracks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-border/50 shadow-lg">
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

            <Card className="border-border/50 shadow-lg">
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

            <Card className="border-border/50 shadow-lg">
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

            <Card className="border-border/50 shadow-lg">
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

      {/* Credibility & Methodology */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-h1 font-bold mb-4">Research-Backed Revenue Analytics</h2>
            <p className="text-h3 text-muted-foreground">
              Our methodology is validated by industry research and proven benchmarks
            </p>
          </div>

          {/* Research Sources */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="border-border/50 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-h1 font-bold text-revenue-primary mb-2">200+</div>
                <div className="text-body text-muted-foreground mb-4">SaaS Companies Analyzed</div>
                <p className="text-small text-muted-foreground">
                  Our calculations are based on real performance data from over 200 SaaS companies across different stages and verticals.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-border/50 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-h1 font-bold text-revenue-success mb-2">15-30%</div>
                <div className="text-body text-muted-foreground mb-4">Typical Revenue Recovery</div>
                <p className="text-small text-muted-foreground">
                  Industry studies show most SaaS companies lose 15-30% of potential revenue through preventable operational gaps.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-h1 font-bold text-revenue-warning mb-2">4</div>
                <div className="text-body text-muted-foreground mb-4">Critical Leak Categories</div>
                <p className="text-small text-muted-foreground">
                  Based on Harvard Business Review research identifying the four primary areas where SaaS revenue leakage occurs.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Methodology Validation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-revenue-success" />
                  Validated Benchmarks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Our industry benchmarks are derived from:
                </p>
                <ul className="space-y-2 text-small text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-revenue-success" />
                    SaaS Capital Annual Survey (2024)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-revenue-success" />
                    ChartMogul SaaS Metrics Report
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-revenue-success" />
                    OpenView Benchmark Report
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-revenue-success" />
                    Bessemer Cloud Index Data
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-revenue-primary" />
                  Transparent Methodology
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Our calculations use proven formulas:
                </p>
                <ul className="space-y-2 text-small text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-revenue-primary" />
                    Lead response impact: InsideSales.com research
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-revenue-primary" />
                    Payment recovery rates: Stripe Billing data
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-revenue-primary" />
                    Conversion benchmarks: Profitwell analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-revenue-primary" />
                    Operational costs: McKinsey efficiency studies
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/10 to-revenue-primary/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-h1 font-bold mb-6">
            Ready to Discover Your Hidden Revenue?
          </h2>
          <p className="text-h3 text-muted-foreground mb-8">
            It takes less than 5 minutes to complete the assessment and see your personalized results.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/calculator">
              <Button size="lg" className="bg-gradient-to-r from-primary to-revenue-primary text-h3 px-8 py-4">
                Start Your Free Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
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
              <a href="/privacy" className="hover:text-foreground">Privacy Policy</a>
              <a href="/terms" className="hover:text-foreground">Terms of Service</a>
              <a href="/contact" className="hover:text-foreground">Contact</a>
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

export default Landing;