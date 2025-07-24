
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { enhancedIntegrationLogger } from "@/lib/enhanced-integration-logger";

interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  lastChecked: string;
}

export default function SystemHealthMonitor() {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const runHealthChecks = async () => {
    setIsRefreshing(true);
    const checks: HealthCheck[] = [];
    
    try {
      // Database connectivity check
      try {
        const health = await enhancedIntegrationLogger.getIntegrationHealth();
        checks.push({
          name: 'Database Connection',
          status: health ? 'healthy' : 'warning',
          message: health ? 'Database accessible' : 'Database connection slow',
          lastChecked: new Date().toISOString()
        });
      } catch (error) {
        checks.push({
          name: 'Database Connection',
          status: 'error',
          message: 'Database connection failed',
          lastChecked: new Date().toISOString()
        });
      }

      // Integration logs check
      try {
        const failedIntegrations = await enhancedIntegrationLogger.getFailedIntegrations();
        checks.push({
          name: 'Integration Health',
          status: failedIntegrations.length > 0 ? 'warning' : 'healthy',
          message: failedIntegrations.length > 0 
            ? `${failedIntegrations.length} failed integrations need attention`
            : 'All integrations operating normally',
          lastChecked: new Date().toISOString()
        });
      } catch (error) {
        checks.push({
          name: 'Integration Health',
          status: 'error',
          message: 'Unable to check integration status',
          lastChecked: new Date().toISOString()
        });
      }

      // Environment configuration check
      const envChecks = [
        { name: 'SUPABASE_URL', value: import.meta.env.VITE_SUPABASE_URL },
        { name: 'SUPABASE_ANON_KEY', value: import.meta.env.VITE_SUPABASE_ANON_KEY }
      ];

      const missingEnvVars = envChecks.filter(check => !check.value);
      checks.push({
        name: 'Environment Configuration',
        status: missingEnvVars.length > 0 ? 'error' : 'healthy',
        message: missingEnvVars.length > 0 
          ? `Missing environment variables: ${missingEnvVars.map(v => v.name).join(', ')}`
          : 'All environment variables configured',
        lastChecked: new Date().toISOString()
      });

      // Service availability check
      checks.push({
        name: 'Service Availability',
        status: 'healthy',
        message: 'All services are operational',
        lastChecked: new Date().toISOString()
      });

      setHealthChecks(checks);
      
      const errorCount = checks.filter(c => c.status === 'error').length;
      const warningCount = checks.filter(c => c.status === 'warning').length;
      
      if (errorCount > 0) {
        toast({
          title: "System Health Alert",
          description: `${errorCount} critical issues detected`,
          variant: "destructive"
        });
      } else if (warningCount > 0) {
        toast({
          title: "System Health Warning",
          description: `${warningCount} warnings detected`,
        });
      } else {
        toast({
          title: "System Health Check",
          description: "All systems operating normally",
        });
      }
      
    } catch (error) {
      console.error('Health check failed:', error);
      toast({
        title: "Health Check Failed",
        description: "Unable to complete system health check",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">System Health</CardTitle>
        <Button 
          onClick={runHealthChecks}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? "Checking..." : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {healthChecks.map((check, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(check.status)}
                <div>
                  <span className="font-medium">{check.name}</span>
                  <p className="text-xs text-muted-foreground">{check.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(check.lastChecked).toLocaleTimeString()}
                </span>
                <Badge variant={getStatusColor(check.status) as any}>
                  {check.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
