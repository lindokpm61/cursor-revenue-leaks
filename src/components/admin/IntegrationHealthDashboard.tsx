import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { enhancedIntegrationLogger } from "@/lib/enhanced-integration-logger";
import { crmIntegrationTester } from "@/lib/crm-integration-tester";
import { AlertCircle, CheckCircle, Clock, RefreshCw, TestTube } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const IntegrationHealthDashboard = () => {
  const [isRunningTests, setIsRunningTests] = useState(false);
  const { toast } = useToast();

  const { data: healthData, refetch: refetchHealth } = useQuery({
    queryKey: ['integration-health'],
    queryFn: () => enhancedIntegrationLogger.getIntegrationHealth(),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: failedIntegrations, refetch: refetchFailed } = useQuery({
    queryKey: ['failed-integrations'],
    queryFn: () => enhancedIntegrationLogger.getFailedIntegrations(),
    refetchInterval: 60000 // Refresh every minute
  });

  const runIntegrationTests = async () => {
    setIsRunningTests(true);
    try {
      const results = await crmIntegrationTester.runFullIntegrationTest();
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      
      toast({
        title: "Integration Tests Complete",
        description: `${successCount}/${totalCount} tests passed`,
        variant: successCount === totalCount ? "default" : "destructive"
      });
      
      // Refresh data after tests
      refetchHealth();
      refetchFailed();
    } catch (error) {
      toast({
        title: "Test Execution Failed",
        description: "Failed to run integration tests",
        variant: "destructive"
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  const getIntegrationStats = () => {
    if (!healthData) return { total: 0, success: 0, failed: 0, pending: 0 };
    
    const stats = healthData.reduce((acc: any, log: any) => {
      acc.total++;
      acc[log.status] = (acc[log.status] || 0) + 1;
      return acc;
    }, { total: 0, success: 0, failed: 0, pending: 0 });
    
    return stats;
  };

  const stats = getIntegrationStats();
  const successRate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Test Integration Button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Integration Testing</CardTitle>
              <CardDescription>Run comprehensive tests on all CRM integrations</CardDescription>
            </div>
            <Button 
              onClick={runIntegrationTests}
              disabled={isRunningTests}
              className="gap-2"
            >
              <TestTube className="h-4 w-4" />
              {isRunningTests ? "Running Tests..." : "Run Tests"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Failed Integrations */}
      {failedIntegrations && failedIntegrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Failed Integrations</CardTitle>
            <CardDescription>Integrations that need attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {failedIntegrations.map((integration: any) => (
                <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">{integration.integration_type}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(integration.created_at).toLocaleString()}
                      </span>
                    </div>
                    {integration.error_message && (
                      <p className="text-sm text-red-600">{integration.error_message}</p>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Retry {integration.retry_count}/{integration.max_retries}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Integration Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest integration attempts</CardDescription>
        </CardHeader>
        <CardContent>
          {healthData && healthData.length > 0 ? (
            <div className="space-y-2">
              {healthData.slice(0, 10).map((log: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={log.status === 'success' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}
                    >
                      {log.integration_type}
                    </Badge>
                    <span className="text-sm">{log.status}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};