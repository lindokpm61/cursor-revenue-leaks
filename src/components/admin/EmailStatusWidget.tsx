
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, AlertCircle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmailMetrics {
  pending_count: number;
  sent_today: number;
  failed_count: number;
  recent_open_rate: number;
}

export default function EmailStatusWidget() {
  const [metrics, setMetrics] = useState<EmailMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmailMetrics();
  }, []);

  const fetchEmailMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('email_sequence_queue')
        .select('status, created_at, opened_at');

      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const emails = data || [];
      const pendingEmails = emails.filter(e => e.status === 'pending');
      const failedEmails = emails.filter(e => e.status === 'failed');
      const sentToday = emails.filter(e => 
        e.status === 'sent' && new Date(e.created_at) >= today
      );
      const sentWithOpens = emails.filter(e => 
        e.status === 'sent' && e.opened_at
      );

      const openRate = emails.filter(e => e.status === 'sent').length > 0 
        ? (sentWithOpens.length / emails.filter(e => e.status === 'sent').length) * 100 
        : 0;

      setMetrics({
        pending_count: pendingEmails.length,
        sent_today: sentToday.length,
        failed_count: failedEmails.length,
        recent_open_rate: openRate,
      });
    } catch (error) {
      console.error('Error fetching email metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Status
        </CardTitle>
        <CardDescription>
          Current email queue and performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{metrics.pending_count}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{metrics.sent_today}</div>
                <div className="text-sm text-muted-foreground">Sent Today</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm">
                  {metrics.recent_open_rate.toFixed(1)}% open rate
                </span>
              </div>
              {metrics.failed_count > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {metrics.failed_count} failed
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link to="/admin/emails">
                  <Mail className="w-4 h-4 mr-2" />
                  Manage
                </Link>
              </Button>
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => supabase.functions.invoke('email-queue-processor')}
              >
                <Send className="w-4 h-4 mr-2" />
                Process
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
