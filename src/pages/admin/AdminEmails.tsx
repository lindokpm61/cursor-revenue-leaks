
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, Ban, RotateCcw, AlertCircle, TrendingUp, Users, Clock } from 'lucide-react';

interface EmailSequence {
  id: string;
  temp_id: string;
  contact_email: string;
  sequence_type: string;
  status: string;
  scheduled_for: string;
  sent_at?: string;
  opened_at?: string;
  clicked_at?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
}

interface EmailStats {
  total_sent: number;
  total_opens: number;
  total_clicks: number;
  open_rate: number;
  click_rate: number;
  pending_count: number;
  failed_count: number;
}

export default function AdminEmails() {
  const [emailQueue, setEmailQueue] = useState<EmailSequence[]>([]);
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchEmailData();
  }, []);

  const fetchEmailData = async () => {
    try {
      setLoading(true);
      
      // Fetch email queue
      const { data: queueData, error: queueError } = await supabase
        .from('email_sequence_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (queueError) throw queueError;

      // Calculate stats
      const stats = calculateEmailStats(queueData || []);
      
      setEmailQueue(queueData || []);
      setEmailStats(stats);
    } catch (error) {
      console.error('Error fetching email data:', error);
      toast({
        title: "Error",
        description: "Failed to load email data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateEmailStats = (emails: EmailSequence[]): EmailStats => {
    const sentEmails = emails.filter(e => e.status === 'sent');
    const pendingEmails = emails.filter(e => e.status === 'pending');
    const failedEmails = emails.filter(e => e.status === 'failed');
    
    const totalOpens = sentEmails.filter(e => e.opened_at).length;
    const totalClicks = sentEmails.filter(e => e.clicked_at).length;

    return {
      total_sent: sentEmails.length,
      total_opens: totalOpens,
      total_clicks: totalClicks,
      open_rate: sentEmails.length ? (totalOpens / sentEmails.length) * 100 : 0,
      click_rate: sentEmails.length ? (totalClicks / sentEmails.length) * 100 : 0,
      pending_count: pendingEmails.length,
      failed_count: failedEmails.length,
    };
  };

  const retryFailedEmail = async (emailId: string) => {
    try {
      const { error } = await supabase
        .from('email_sequence_queue')
        .update({ 
          status: 'pending',
          scheduled_for: new Date().toISOString(),
          retry_count: 0,
          error_message: null
        })
        .eq('id', emailId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email scheduled for retry",
      });
      
      fetchEmailData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to retry email",
        variant: "destructive",
      });
    }
  };

  const cancelEmail = async (emailId: string) => {
    try {
      const { error } = await supabase
        .from('email_sequence_queue')
        .update({ status: 'cancelled' })
        .eq('id', emailId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email cancelled",
      });
      
      fetchEmailData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel email",
        variant: "destructive",
      });
    }
  };

  const processEmailQueue = async () => {
    try {
      const { error } = await supabase.functions.invoke('email-queue-processor');
      
      if (error) throw error;

      toast({
        title: "Success",
        description: "Email queue processing initiated",
      });
      
      // Refresh data after a delay
      setTimeout(fetchEmailData, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process email queue",
        variant: "destructive",
      });
    }
  };

  const filteredEmails = emailQueue.filter(email => {
    const matchesFilter = filter === 'all' || email.status === filter;
    const matchesSearch = email.contact_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.sequence_type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Email Management</h1>
        </div>
        <div className="text-center py-8">Loading email data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Management</h1>
          <p className="text-muted-foreground">Monitor and manage email sequences and campaigns</p>
        </div>
        <Button onClick={processEmailQueue} className="gap-2">
          <Send className="w-4 h-4" />
          Process Queue
        </Button>
      </div>

      {/* Email Stats Overview */}
      {emailStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{emailStats.total_sent}</div>
              <p className="text-xs text-muted-foreground">
                {emailStats.open_rate.toFixed(1)}% open rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{emailStats.pending_count}</div>
              <p className="text-xs text-muted-foreground">
                Scheduled for delivery
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{emailStats.total_clicks}</div>
              <p className="text-xs text-muted-foreground">
                {emailStats.click_rate.toFixed(1)}% click rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{emailStats.failed_count}</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue">Email Queue</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="unsubscribes">Unsubscribes</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Queue Management</CardTitle>
              <CardDescription>
                Monitor and manage individual email sequences
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Input
                  placeholder="Search by email or sequence type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="max-w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Email Queue Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Sequence Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Engagement</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmails.map((email) => (
                      <TableRow key={email.id}>
                        <TableCell className="font-medium">
                          {email.contact_email}
                        </TableCell>
                        <TableCell>{email.sequence_type}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(email.status)}>
                            {email.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(email.scheduled_for).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {email.opened_at && (
                              <Badge variant="outline" className="text-xs">
                                Opened
                              </Badge>
                            )}
                            {email.clicked_at && (
                              <Badge variant="outline" className="text-xs">
                                Clicked
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {email.status === 'failed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => retryFailedEmail(email.id)}
                              >
                                <RotateCcw className="w-3 h-3" />
                              </Button>
                            )}
                            {email.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelEmail(email.id)}
                              >
                                <Ban className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Email Performance Analytics</CardTitle>
              <CardDescription>
                Detailed performance metrics for email campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Email analytics dashboard coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unsubscribes">
          <Card>
            <CardHeader>
              <CardTitle>Unsubscribe Management</CardTitle>
              <CardDescription>
                Manage email unsubscribes and suppression lists
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Unsubscribe management interface coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
