import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, BarChart3, Upload } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const QuickActionsPanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleExportLeads = async () => {
    setLoading('export');
    try {
      // Simulate export operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Export Complete",
        description: "All leads have been exported to CSV",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export leads",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleRefreshData = async () => {
    setLoading('refresh');
    try {
      // Simulate refresh operation
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: "Data Refreshed",
        description: "Dashboard data has been updated",
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleViewMetabase = () => {
    // Future integration with Metabase
    toast({
      title: "Coming Soon",
      description: "Metabase integration will be available soon",
    });
  };

  const handleManualSync = async () => {
    setLoading('sync');
    try {
      // Simulate manual sync operation
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast({
        title: "Sync Complete",
        description: "Manual CRM sync completed successfully",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Manual CRM sync failed",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleExportLeads}
            disabled={loading !== null}
            variant="outline"
            className="h-12 flex flex-col gap-1"
          >
            <Download className="h-4 w-4" />
            <span className="text-xs">
              {loading === 'export' ? 'Exporting...' : 'Export All Leads'}
            </span>
          </Button>

          <Button
            onClick={handleRefreshData}
            disabled={loading !== null}
            variant="outline"
            className="h-12 flex flex-col gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${loading === 'refresh' ? 'animate-spin' : ''}`} />
            <span className="text-xs">
              {loading === 'refresh' ? 'Refreshing...' : 'Refresh Data'}
            </span>
          </Button>

          <Button
            onClick={handleViewMetabase}
            disabled={loading !== null}
            variant="outline"
            className="h-12 flex flex-col gap-1"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs">View in Metabase</span>
          </Button>

          <Button
            onClick={handleManualSync}
            disabled={loading !== null}
            variant="outline"
            className="h-12 flex flex-col gap-1"
          >
            <Upload className="h-4 w-4" />
            <span className="text-xs">
              {loading === 'sync' ? 'Syncing...' : 'Manual Sync to CRM'}
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsPanel;