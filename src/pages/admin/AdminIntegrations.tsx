
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IntegrationHealthDashboard } from "@/components/admin/IntegrationHealthDashboard";
import IntegrationStatusWidget from "@/components/admin/IntegrationStatusWidget";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, TestTube, Activity, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { crmIntegrationTester } from "@/lib/crm-integration-tester";

export default function AdminIntegrations() {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);

  const handleRunTests = async () => {
    setTesting(true);
    try {
      const results = await crmIntegrationTester.runFullIntegrationTest();
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      
      toast({
        title: "Integration Tests Complete",
        description: `${successCount}/${totalCount} tests passed`,
        variant: successCount === totalCount ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to run integration tests",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">Manage and monitor third-party integrations</p>
        </div>
        <Button onClick={handleRunTests} disabled={testing} className="gap-2">
          <TestTube className="h-4 w-4" />
          {testing ? "Running Tests..." : "Run All Tests"}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Quick Status Overview */}
        <IntegrationStatusWidget />

        <Tabs defaultValue="health" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="health" className="gap-2">
              <Activity className="h-4 w-4" />
              Health Dashboard
            </TabsTrigger>
            <TabsTrigger value="configuration" className="gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="testing" className="gap-2">
              <TestTube className="h-4 w-4" />
              Testing
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="health">
            <IntegrationHealthDashboard />
          </TabsContent>

          <TabsContent value="configuration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Twenty CRM</h3>
                      <p className="text-sm text-muted-foreground">Customer relationship management</p>
                    </div>
                    <Badge variant="default">Configured</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">N8N Automation</h3>
                      <p className="text-sm text-muted-foreground">Workflow automation and webhooks</p>
                    </div>
                    <Badge variant="default">Configured</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Smartlead</h3>
                      <p className="text-sm text-muted-foreground">Email automation and campaigns</p>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Testing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Test individual integrations or run comprehensive end-to-end tests.
                </p>
                <div className="grid gap-3">
                  <Button variant="outline" className="justify-start">
                    Test Twenty CRM Connection
                  </Button>
                  <Button variant="outline" className="justify-start">
                    Test N8N Webhooks
                  </Button>
                  <Button variant="outline" className="justify-start">
                    Test Email Automation
                  </Button>
                  <Button variant="outline" className="justify-start">
                    Test End-to-End Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Real-time integration logs and monitoring will be displayed here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
