import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const TestSync = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const handleSync = async () => {
    setLoading(true);
    setResults(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-daily-users', {
        body: {}
      });
      
      if (error) {
        throw error;
      }
      
      setResults(data);
      toast({
        title: "Sync completed",
        description: `Processed ${data.stats?.processed || 0} users`,
      });
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Daily User CRM Sync</CardTitle>
          <CardDescription>
            Sync today's new users to the CRM system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleSync} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Syncing..." : "Sync Today's Users"}
          </Button>
          
          {results && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Sync Results:</h3>
              <div className="space-y-2 text-sm">
                <p>Total users today: {results.stats?.totalUsersToday || 0}</p>
                <p>Already in CRM: {results.stats?.alreadyInCrm || 0}</p>
                <p>Processed: {results.stats?.processed || 0}</p>
                <p>Successful: {results.stats?.successful || 0}</p>
                <p>Errors: {results.stats?.errors || 0}</p>
              </div>
              
              {results.results && results.results.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Detailed Results:</h4>
                  <div className="max-h-40 overflow-y-auto">
                    {results.results.map((result: any, index: number) => (
                      <div key={index} className="text-xs p-2 bg-background rounded mb-1">
                        <p className="font-medium">{result.email}</p>
                        <p className={result.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                          {result.status === 'success' ? `✓ Created (${result.personId})` : `✗ ${result.error}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestSync;