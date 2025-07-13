import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  CheckCircle, XCircle, AlertCircle, RefreshCw, 
  Zap, Mail, Database, Activity, Users
} from "lucide-react";
import { integrationLogService, submissionService } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminIntegrations = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [integrationLogs, setIntegrationLogs] = useState<any[]>([]);
  const [integrationStats, setIntegrationStats] = useState({
    twentyCRM: { success: 0, failed: 0, lastSync: null },
    n8n: { success: 0, failed: 0, lastSync: null },
    smartlead: { success: 0, failed: 0, lastSync: null },
  });
  const { toast } = useToast();

  useEffect(() => {
    loadIntegrationData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadIntegrationData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadIntegrationData = async () => {
    try {
      // Get recent integration logs from both integration_logs and automation_logs
      const [integrationLogs, automationLogs] = await Promise.all([
        Promise.all([
          integrationLogService.getByType('twenty_crm', 25),
          integrationLogService.getByType('n8n', 25),
          integrationLogService.getByType('smartlead', 25),
        ]),
        // Also fetch from automation_logs for comprehensive view
        supabase
          .from('automation_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(25)
      ]);

      // Combine integration logs
      const [twentyLogs, n8nLogs, smartleadLogs] = integrationLogs;
      const combinedIntegrationLogs = [
        ...(twentyLogs.data || []),
        ...(n8nLogs.data || []),
        ...(smartleadLogs.data || []),
      ];

      // Convert automation logs to integration log format for display
      const convertedAutomationLogs = (automationLogs.data || []).map(log => ({
        id: log.id,
        integration_type: log.workflow_type,
        status: log.status,
        error_message: log.error,
        response_data: log.results,
        retry_count: 0,
        submission_id: null,
        created_at: log.created_at
      }));

      const allLogs = [
        ...combinedIntegrationLogs,
        ...convertedAutomationLogs,
      ].sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());

      setIntegrationLogs(allLogs.slice(0, 20));

      // Calculate stats from combined logs
      const calculateStats = (logs: any[], type: string) => {
        const filteredLogs = logs.filter(log => {
          if (type === 'twenty_crm') {
            return log.integration_type === 'twenty_crm' || log.integration_type === 'crm-integration';
          } else if (type === 'n8n') {
            return log.integration_type === 'n8n' || 
                   log.integration_type === 'lead-qualification' ||
                   log.integration_type === 'high-value-alert' ||
                   log.integration_type === 'analytics-reporting' ||
                   log.integration_type === 'results-calculated';
          } else if (type === 'smartlead') {
            return log.integration_type === 'smartlead' || 
                   log.integration_type === 'email-automation' ||
                   log.integration_type === 'abandonment-recovery';
          }
          return false;
        });

        return {
          success: filteredLogs.filter(log => log.status === 'success').length,
          failed: filteredLogs.filter(log => log.status === 'failed' || log.status === 'error').length,
          lastSync: filteredLogs.length > 0 ? filteredLogs[0].created_at : null,
        };
      };

      setIntegrationStats({
        twentyCRM: calculateStats(allLogs, 'twenty_crm'),
        n8n: calculateStats(allLogs, 'n8n'),
        smartlead: calculateStats(allLogs, 'smartlead'),
      });

    } catch (error) {
      console.error('Error loading integration data:', error);
      toast({
        title: "Error",
        description: "Failed to load integration data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFullCrmSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-daily-users', {
        body: { syncAll: true }
      });

      if (error) throw error;

      toast({
        title: "CRM Sync Completed",
        description: `Successfully synced ${data.successCount} users to CRM. ${data.errorCount} errors occurred.`,
      });
      
      // Refresh integration data after sync
      await loadIntegrationData();
    } catch (error: any) {
      console.error('Error syncing to CRM:', error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync users to CRM",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-revenue-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-revenue-danger" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-revenue-warning" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      failed: 'destructive',
      pending: 'secondary',
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    );
  };

  const getIntegrationIcon = (type: string) => {
    // Map various integration types to their appropriate icons
    if (type === 'twenty_crm' || type === 'crm-integration') {
      return <Database className="h-5 w-5" />;
    } else if (type === 'smartlead' || type === 'email-automation' || type === 'abandonment-recovery') {
      return <Mail className="h-5 w-5" />;
    } else if (type === 'n8n' || type === 'lead-qualification' || type === 'high-value-alert' || 
               type === 'analytics-reporting' || type === 'results-calculated') {
      return <Zap className="h-5 w-5" />;
    } else {
      return <Activity className="h-5 w-5" />;
    }
  };

  const getHealthStatus = (success: number, failed: number) => {
    const total = success + failed;
    if (total === 0) return { status: 'inactive', color: 'text-muted-foreground' };
    
    const successRate = (success / total) * 100;
    if (successRate >= 95) return { status: 'healthy', color: 'text-revenue-success' };
    if (successRate >= 80) return { status: 'warning', color: 'text-revenue-warning' };
    return { status: 'critical', color: 'text-revenue-danger' };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Integration Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor sync status and health of external service integrations
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleFullCrmSync} disabled={syncing} variant="default">
            <Users className="h-4 w-4 mr-2" />
            {syncing ? "Syncing..." : "Sync All Users to CRM"}
          </Button>
          <Button onClick={loadIntegrationData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Integration Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Twenty CRM */}
        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <span className="font-medium">Twenty CRM</span>
              </div>
              <div className={`text-sm font-medium ${getHealthStatus(integrationStats.twentyCRM.success, integrationStats.twentyCRM.failed).color}`}>
                {getHealthStatus(integrationStats.twentyCRM.success, integrationStats.twentyCRM.failed).status.toUpperCase()}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Successful syncs:</span>
                <span className="text-revenue-success font-medium">{integrationStats.twentyCRM.success}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Failed syncs:</span>
                <span className="text-revenue-danger font-medium">{integrationStats.twentyCRM.failed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last sync:</span>
                <span className="font-medium">
                  {integrationStats.twentyCRM.lastSync ? 
                    new Date(integrationStats.twentyCRM.lastSync).toLocaleString() : 
                    'Never'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* N8N */}
        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <span className="font-medium">N8N Workflows</span>
              </div>
              <div className={`text-sm font-medium ${getHealthStatus(integrationStats.n8n.success, integrationStats.n8n.failed).color}`}>
                {getHealthStatus(integrationStats.n8n.success, integrationStats.n8n.failed).status.toUpperCase()}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Successful triggers:</span>
                <span className="text-revenue-success font-medium">{integrationStats.n8n.success}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Failed triggers:</span>
                <span className="text-revenue-danger font-medium">{integrationStats.n8n.failed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last trigger:</span>
                <span className="font-medium">
                  {integrationStats.n8n.lastSync ? 
                    new Date(integrationStats.n8n.lastSync).toLocaleString() : 
                    'Never'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Smartlead */}
        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <span className="font-medium">Smartlead</span>
              </div>
              <div className={`text-sm font-medium ${getHealthStatus(integrationStats.smartlead.success, integrationStats.smartlead.failed).color}`}>
                {getHealthStatus(integrationStats.smartlead.success, integrationStats.smartlead.failed).status.toUpperCase()}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Successful campaigns:</span>
                <span className="text-revenue-success font-medium">{integrationStats.smartlead.success}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Failed campaigns:</span>
                <span className="text-revenue-danger font-medium">{integrationStats.smartlead.failed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last campaign:</span>
                <span className="font-medium">
                  {integrationStats.smartlead.lastSync ? 
                    new Date(integrationStats.smartlead.lastSync).toLocaleString() : 
                    'Never'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Logs */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>Recent Integration Activity</CardTitle>
          <CardDescription>
            Latest sync attempts and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Integration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submission</TableHead>
                <TableHead>Error Message</TableHead>
                <TableHead>Retry Count</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {integrationLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="space-y-2">
                      <Activity className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-muted-foreground">No integration activity yet</p>
                      <p className="text-sm text-muted-foreground">
                        Integration logs will appear here once submissions start triggering workflows and integrations.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                integrationLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getIntegrationIcon(log.integration_type)}
                        <span className="capitalize">{log.integration_type.replace(/[_-]/g, ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        {getStatusBadge(log.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.submission_id ? (
                        <span className="font-mono text-sm">{log.submission_id.slice(0, 8)}...</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.error_message ? (
                        <span className="text-sm text-revenue-danger max-w-xs truncate block">
                          {log.error_message}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={log.retry_count > 0 ? 'text-revenue-warning' : 'text-muted-foreground'}>
                        {log.retry_count || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(log.created_at!).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminIntegrations;