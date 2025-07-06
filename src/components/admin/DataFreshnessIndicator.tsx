import { Card, CardContent } from "@/components/ui/card";
import { Clock, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

const DataFreshnessIndicator = () => {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [nextRefresh, setNextRefresh] = useState(300); // 5 minutes in seconds

  useEffect(() => {
    const interval = setInterval(() => {
      setNextRefresh(prev => {
        if (prev <= 1) {
          setLastUpdated(new Date());
          return 300; // Reset to 5 minutes
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes === 1) return "1 minute ago";
    return `${diffInMinutes} minutes ago`;
  };

  const formatNextRefresh = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) return `${remainingSeconds}s`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Card className="border-border/50 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Data last updated: <span className="font-medium text-foreground">{formatTimeAgo(lastUpdated)}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Auto-refresh in: <span className="font-medium">{formatNextRefresh(nextRefresh)}</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataFreshnessIndicator;