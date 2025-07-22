import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, BarChart3, Mail, Users, UserCog, Zap, LayoutDashboard, Settings, TestTube, Cog } from 'lucide-react';
import EmailStatusWidget from '@/components/admin/EmailStatusWidget';

interface Submission {
  id: string;
  created_at: string;
  user_id: string;
  company_name: string;
  recovery_potential_85?: number;
  // Add other submission properties as needed
}

interface UserProfile {
  id: string;
  created_at: string;
  user_type?: string;
  company_name?: string;
  // Add other profile properties as needed
}

interface DashboardMetrics {
  total_submissions: number;
  avg_recovery_potential: number;
  total_users: number;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [recentUsers, setRecentUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch metrics
      const { count: totalSubmissions } = await supabase
        .from('calculator_submissions')
        .select('*', { count: 'exact', head: true });

      const { data: avgData } = await supabase
        .from('calculator_submissions')
        .select('recovery_potential_85');

      const avgRecoveryPotential = avgData?.length ? 
        avgData.reduce((sum, row) => sum + (row.recovery_potential_85 || 0), 0) / avgData.length : 0;

      // Fetch total users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      setMetrics({
        total_submissions: totalSubmissions || 0,
        avg_recovery_potential: avgRecoveryPotential,
        total_users: userCount || 0,
      });

      // Fetch recent submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('calculator_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (submissionsError) throw submissionsError;

      setRecentSubmissions(submissionsData || []);

      // Fetch recent users
      const { data: users, error: usersError2 } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (usersError2) throw usersError2;

      setRecentUsers(users || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor system health and key metrics
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      {loading ? (
        <div>Loading metrics...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.total_submissions}</div>
              <p className="text-xs text-muted-foreground">
                All calculator submissions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Recovery Potential</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics?.avg_recovery_potential?.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Average potential revenue recovery
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.total_users}</div>
              <p className="text-xs text-muted-foreground">
                Registered users on the platform
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health Widget */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Healthy
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Service</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Integrations</span>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                  Monitoring
                </Badge>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full mt-4">
                <Link to="/admin/system-health">
                  View Details
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email Status Widget */}
        <EmailStatusWidget />

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" size="sm" className="w-full justify-start">
              <Link to="/admin/leads">
                <Users className="w-4 h-4 mr-2" />
                View All Leads
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full justify-start">
              <Link to="/admin/analytics">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full justify-start">
              <Link to="/admin/emails">
                <Mail className="w-4 h-4 mr-2" />
                Email Management
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full justify-start">
              <Link to="/admin/integrations">
                <Settings className="w-4 h-4 mr-2" />
                Integrations
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Latest calculator submissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div>Loading submissions...</div>
            ) : (
              <div className="divide-y divide-border">
                {recentSubmissions.map((submission) => (
                  <div key={submission.id} className="py-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{submission.company_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(submission.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Potential: ${submission.recovery_potential_85 || 0}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Newly registered users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div>Loading users...</div>
            ) : (
              <div className="divide-y divide-border">
                {recentUsers.map((user) => (
                  <div key={user.id} className="py-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{user.company_name || 'Unknown User'}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user.user_type || 'Standard'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
