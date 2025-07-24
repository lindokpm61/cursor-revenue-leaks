import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  RefreshCw, 
  Server,
  TrendingUp,
  Wifi,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { IntegrationHealthDashboard } from '@/components/admin/IntegrationHealthDashboard';

interface HealthData {
  timestamp: string;
  integrations: {
    n8n: { healthy: boolean; status?: number; error?: string; response_time?: number };
    twenty_crm: { healthy: boolean; status?: number; error?: string; response_time?: number };
    smartlead: { healthy: boolean; status?: number; error?: string; response_time?: number };
    supabase: { healthy: boolean; status?: number; error?: string; response_time?: number };
  };
  system: {
    database: { healthy: boolean; status?: number; error?: string; response_time?: number };
    cpu_usage?: number;
    memory_usage?: number;
    active_connections?: number;
  };
  recent_activity: {
    workflows_triggered_24h: number;
    emails_sent_24h: number;
    crm_syncs_24h: number;
    errors_24h: number;
    avg_response_time_ms: number;
    uptime_percentage: number;
  };
  overall_status: string;
  alerts: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
  }>;
}

const AdminSystemHealth: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('integration-health');
      
      if (error) throw error;
      
      setHealthData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching health data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system health data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (healthy: boolean) => {
    return healthy ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (healthy: boolean) => {
    return healthy ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />;
  };

  const getAlertVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'default';
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'unhealthy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading && !healthData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">System Health</h1>
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">System Health</h1>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load system health data. Please try refreshing.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Health</h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated?.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getOverallStatusColor(healthData.overall_status)}`}></div>
            <span className="font-medium capitalize">{healthData.overall_status}</span>
          </div>
          <Button onClick={fetchHealthData} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="integrations">Integration Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Alerts */}
          {healthData.alerts.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Active Alerts</h2>
              {healthData.alerts.map((alert, index) => (
                <Alert key={index} variant={getAlertVariant(alert.severity)}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{alert.message}</span>
                    <Badge variant="outline">{alert.severity}</Badge>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* System Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database</CardTitle>
                <Database className={`h-4 w-4 ${getStatusColor(healthData.system.database.healthy)}`} />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {getStatusIcon(healthData.system.database.healthy)}
                  <span className="text-2xl font-bold">
                    {healthData.system.database.healthy ? 'Online' : 'Offline'}
                  </span>
                </div>
                {healthData.system.database.response_time && (
                  <p className="text-xs text-muted-foreground">
                    {healthData.system.database.response_time}ms response
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {healthData.recent_activity.uptime_percentage}%
                </div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {healthData.recent_activity.avg_response_time_ms}ms
                </div>
                <p className="text-xs text-muted-foreground">Average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Errors</CardTitle>
                <AlertTriangle className={`h-4 w-4 ${healthData.recent_activity.errors_24h > 0 ? 'text-red-600' : 'text-green-600'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {healthData.recent_activity.errors_24h}
                </div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>
          </div>

          {/* Integration Status */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Integration Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(healthData.integrations).map(([name, status]) => (
                <Card key={name}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium capitalize">
                      {name.replace('_', ' ')}
                    </CardTitle>
                    <Wifi className={`h-4 w-4 ${getStatusColor(status.healthy)}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status.healthy)}
                      <span className="font-medium">
                        {status.healthy ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    {status.response_time && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {status.response_time}ms
                      </p>
                    )}
                    {status.error && (
                      <p className="text-xs text-red-600 mt-1">{status.error}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Activity Metrics */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Activity (24h)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Workflows Triggered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {healthData.recent_activity.workflows_triggered_24h}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Emails Sent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {healthData.recent_activity.emails_sent_24h}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">CRM Syncs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {healthData.recent_activity.crm_syncs_24h}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <IntegrationHealthDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSystemHealth;