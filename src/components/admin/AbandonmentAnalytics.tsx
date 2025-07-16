import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Users, TrendingUp, Clock, Mail, PlayCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface AbandonmentRecord {
  temp_id: string;
  current_step: number;
  email: string | null;
  company_name: string | null;
  time_on_page: number;
  last_activity: string;
  recovery_potential: number | null;
  abandonment_reason: string;
}

export const AbandonmentAnalytics: React.FC = () => {
  const [abandonmentData, setAbandonmentData] = useState<AbandonmentRecord[]>([]);
  const [emailSequences, setEmailSequences] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAbandonmentData();
    loadEmailSequences();
  }, []);

  const loadAbandonmentData = async () => {
    try {
      // Get temporary submissions that haven't been converted and have some engagement
      const { data, error } = await supabase
        .from('temporary_submissions')
        .select('*')
        .is('converted_to_user_id', null)
        .gte('time_spent_seconds', 30) // At least 30 seconds
        .gte('last_activity_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('last_activity_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const abandonmentRecords: AbandonmentRecord[] = data?.map(item => ({
        temp_id: item.temp_id,
        current_step: item.current_step || 1,
        email: item.email,
        company_name: item.company_name,
        time_on_page: item.time_spent_seconds || 0,
        last_activity: item.last_activity_at || item.created_at || '',
        recovery_potential: item.recovery_potential,
        abandonment_reason: item.current_step > 1 ? 'step_abandonment' : 'early_exit'
      })) || [];

      setAbandonmentData(abandonmentRecords);
    } catch (error) {
      console.error('Error loading abandonment data:', error);
    }
  };

  const loadEmailSequences = async () => {
    try {
      const { data, error } = await supabase
        .from('email_sequence_queue')
        .select('*')
        .like('sequence_type', 'abandonment_%')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setEmailSequences(data || []);
    } catch (error) {
      console.error('Error loading email sequences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerManualRecovery = async (tempId: string) => {
    try {
      const { error } = await supabase.functions.invoke('automation-processor', {
        body: {
          action: 'process_abandonment_recovery',
          temp_id: tempId,
          manual_trigger: true
        }
      });

      if (error) throw error;
      
      await loadEmailSequences(); // Refresh the list
    } catch (error) {
      console.error('Error triggering recovery:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
        <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Abandoned Sessions</p>
                <p className="text-2xl font-bold">{abandonmentData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Recovery Emails</p>
                <p className="text-2xl font-bold">{emailSequences.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">With Email</p>
                <p className="text-2xl font-bold">
                  {abandonmentData.filter(item => item.email).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    abandonmentData.reduce((sum, item) => sum + (item.recovery_potential || 0), 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abandonment Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Abandonment Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {abandonmentData.map((record) => (
              <div
                key={record.temp_id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <Badge variant={record.current_step > 2 ? "destructive" : "secondary"}>
                        Step {record.current_step}
                      </Badge>
                      {record.company_name && (
                        <span className="font-medium">{record.company_name}</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(record.last_activity)}
                      </span>
                      {record.time_on_page > 0 && (
                        <span>{Math.floor(record.time_on_page / 60)}m {record.time_on_page % 60}s on page</span>
                      )}
                      {record.recovery_potential && (
                        <span className="text-green-600 font-medium">
                          {formatCurrency(record.recovery_potential)} potential
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {record.email ? (
                    <Badge variant="outline" className="text-green-600">
                      Has Email
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600">
                      No Email
                    </Badge>
                  )}
                  
                  {record.email && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => triggerManualRecovery(record.temp_id)}
                      className="flex items-center gap-1"
                    >
                      <PlayCircle className="h-3 w-3" />
                      Trigger Recovery
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {abandonmentData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No recent abandonment records found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email Sequences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Abandonment Recovery Emails
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {emailSequences.map((sequence) => (
              <div
                key={sequence.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <Badge variant={sequence.status === 'sent' ? 'default' : 'secondary'}>
                        {sequence.sequence_type}
                      </Badge>
                      <span className="font-medium">{sequence.contact_email}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Scheduled for: {new Date(sequence.scheduled_for).toLocaleString()}
                      {sequence.sent_at && (
                        <span className="ml-4">
                          Sent: {new Date(sequence.sent_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Badge
                  variant={
                    sequence.status === 'sent' ? 'default' :
                    sequence.status === 'pending' ? 'secondary' :
                    'destructive'
                  }
                >
                  {sequence.status}
                </Badge>
              </div>
            ))}
            
            {emailSequences.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No abandonment recovery emails found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};