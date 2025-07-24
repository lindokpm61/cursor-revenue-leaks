import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface IntegrationStatus {
  name: string;
  status: 'connected' | 'error' | 'syncing';
  lastSync?: string;
  error?: string;
}

const IntegrationStatusWidget = () => {
  const { toast } = useToast();
  const [retrying, setRetrying] = useState(false);
  
  // Mock integration status - replace with real API calls
  const integrations: IntegrationStatus[] = [
    { name: "Twenty CRM", status: "connected", lastSync: "2 min ago" },
    { name: "N8N Webhook", status: "connected" },
    { name: "Smartlead", status: "connected", lastSync: "5 min ago" },
    { name: "Database", status: "connected" }
  ];

  const hasFailures = integrations.some(i => i.status === 'error');

  const handleRetryFailed = async () => {
    setRetrying(true);
    try {
      // Simulate retry operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Retry Complete",
        description: "Failed syncs have been retried successfully",
      });
    } catch (error) {
      toast({
        title: "Retry Failed",
        description: "Some integrations still have issues",
        variant: "destructive",
      });
    } finally {
      setRetrying(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-revenue-success" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-revenue-danger" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-revenue-warning animate-spin" />;
      default:
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'default';
      case 'error':
        return 'destructive';
      case 'syncing':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">System Health</CardTitle>
        {hasFailures && (
          <Button 
            onClick={handleRetryFailed}
            disabled={retrying}
            variant="outline"
            size="sm"
          >
            {retrying ? "Retrying..." : "Retry Failed Syncs"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {integrations.map((integration) => (
            <div key={integration.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(integration.status)}
                <span className="font-medium">{integration.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {integration.lastSync && (
                  <span className="text-xs text-muted-foreground">
                    {integration.lastSync}
                  </span>
                )}
                <Badge variant={getStatusColor(integration.status) as any}>
                  {integration.status === 'connected' ? 'Connected' : 
                   integration.status === 'error' ? 'Error' : 'Syncing'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default IntegrationStatusWidget;