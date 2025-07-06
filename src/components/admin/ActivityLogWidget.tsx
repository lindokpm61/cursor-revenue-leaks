import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface Activity {
  id: string;
  message: string;
  timestamp: Date;
  type: 'submission' | 'sync' | 'campaign' | 'system';
}

const ActivityLogWidget = () => {
  const [activities, setActivities] = useState<Activity[]>([]);

  // Mock activity data - replace with real API calls
  useEffect(() => {
    const mockActivities: Activity[] = [
      {
        id: '1',
        message: 'TechFlow submission received',
        timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        type: 'submission'
      },
      {
        id: '2',
        message: 'CloudSync synced to CRM',
        timestamp: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
        type: 'sync'
      },
      {
        id: '3',
        message: 'DataDrive added to email campaign',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        type: 'campaign'
      },
      {
        id: '4',
        message: 'ScaleUp Industries scored as high-value lead',
        timestamp: new Date(Date.now() - 22 * 60 * 1000), // 22 minutes ago
        type: 'submission'
      },
      {
        id: '5',
        message: 'System health check completed',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        type: 'system'
      }
    ];

    setActivities(mockActivities);
  }, []);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes === 1) return "1 min ago";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return "1 hour ago";
    return `${diffInHours} hours ago`;
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'submission':
        return 'default';
      case 'sync':
        return 'secondary';
      case 'campaign':
        return 'outline';
      case 'system':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-3">
                <Badge variant={getActivityColor(activity.type) as any} className="text-xs">
                  {activity.type}
                </Badge>
                <span className="text-sm">{activity.message}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(activity.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityLogWidget;