import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, Filter, Download, Eye, ArrowUpDown, RefreshCw, AlertCircle,
  Target, Clock, Users, TrendingUp, Phone, Mail, UserPlus
} from "lucide-react";
import { Link } from "react-router-dom";
import { submissionService, leadScoringService } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EmailService } from "@/lib/emailService";

const AdminLeads = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculatingScores, setRecalculatingScores] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [engagementFilter, setEngagementFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();

  useEffect(() => {
    loadSubmissions();
  }, []);

  useEffect(() => {
    filterAndSortSubmissions();
  }, [submissions, searchTerm, industryFilter, statusFilter, engagementFilter, actionFilter, sortField, sortDirection]);

  const loadSubmissions = async () => {
    try {
      // Load submissions with user data and engagement metrics
      const response = await submissionService.getAllWithUserData(1000);
      if (response.data) {
        // Enhance with engagement data from user_profiles
        const enhancedData = await Promise.all(
          response.data.map(async (submission: any) => {
            try {
              const { data: profileData, error } = await supabase
                .from('user_profiles')
                .select('engagement_score, last_action_plan_visit, total_time_spent, return_visits, high_intent_lead, checked_actions')
                .eq('id', submission.user_id)
                .single();
              
              if (error) {
                console.warn('Profile data error:', error);
                return {
                  ...submission,
                  engagement_score: 0,
                  actions_checked_count: 0,
                  last_action_plan_visit: null,
                  total_time_spent: 0,
                  return_visits: 0,
                  high_intent_lead: false
                };
              }

              // Calculate actions_checked_count from checked_actions array
              const actionsCheckedCount = Array.isArray(profileData?.checked_actions) 
                ? profileData.checked_actions.length 
                : 0;

              return {
                ...submission,
                engagement_score: profileData?.engagement_score || 0,
                actions_checked_count: actionsCheckedCount,
                last_action_plan_visit: profileData?.last_action_plan_visit || null,
                total_time_spent: profileData?.total_time_spent || 0,
                return_visits: profileData?.return_visits || 0,
                high_intent_lead: profileData?.high_intent_lead || false
              };
            } catch (error) {
              console.warn('Error loading profile data:', error);
              return {
                ...submission,
                engagement_score: 0,
                actions_checked_count: 0,
                last_action_plan_visit: null,
                total_time_spent: 0,
                return_visits: 0,
                high_intent_lead: false
              };
            }
          })
        );
        setSubmissions(enhancedData);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortSubmissions = () => {
    let filtered = [...submissions];

    // Apply filters
    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.contact_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.user_email && sub.user_email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (industryFilter !== "all") {
      filtered = filtered.filter(sub => sub.industry === industryFilter);
    }

    // Engagement filter
    if (engagementFilter !== "all") {
      filtered = filtered.filter(sub => {
        const score = sub.engagement_score || 0;
        switch (engagementFilter) {
          case "high": return score >= 70;
          case "medium": return score >= 40 && score < 70;
          case "low": return score < 40;
          default: return true;
        }
      });
    }

    // Action filter
    if (actionFilter !== "all") {
      filtered = filtered.filter(sub => {
        const actionsChecked = sub.actions_checked_count || 0;
        switch (actionFilter) {
          case "active": return actionsChecked >= 2;
          case "started": return actionsChecked === 1;
          case "viewing": return actionsChecked === 0;
          default: return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredSubmissions(filtered);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const exportData = () => {
    const csvContent = [
      'Company Name,Contact Email,User Email,User Company,User Submissions Count,Industry,Current ARR,Total Leakage,Recovery Potential,Lead Score,Created Date,User Registered',
      ...filteredSubmissions.map(sub => [
        sub.company_name,
        sub.contact_email,
        sub.user_email || 'N/A',
        sub.user_company_name || 'N/A',
        sub.user_total_submissions || 0,
        sub.industry || '',
        sub.current_arr || 0,
        sub.total_leak || 0,
        sub.recovery_potential_70 || 0,
        sub.lead_score || 0,
        sub.created_at || '',
        sub.user_registered_date || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'revenue-leak-leads.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getEngagementLevel = (score: number) => {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  const getScoreLevel = (score: number) => {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0m';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleQuickAction = async (action: string, submission: any) => {
    // Track admin action
    console.log(`Admin action: ${action} for submission ${submission.id}`);
    
    if (action === 'Send Follow-up Email') {
      try {
        const result = await EmailService.sendResultsEmail(
          submission.contact_email,
          {
            userName: submission.contact_email.split('@')[0],
            companyName: submission.company_name,
            totalLeak: submission.total_leak || 0,
            recoveryPotential: submission.recovery_potential_70 || 0,
            resultUrl: `${window.location.origin}/results/${submission.id}`
          }
        );

        if (result.success) {
          toast({
            title: "Email Sent Successfully",
            description: `Follow-up email sent to ${submission.contact_email}`,
          });
        } else {
          throw new Error(result.error || 'Failed to send email');
        }
      } catch (error) {
        console.error('Email sending error:', error);
        toast({
          title: "Email Failed",
          description: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      }
    } else if (action === 'Test Welcome Email') {
      try {
        const result = await EmailService.sendWelcomeEmail(
          submission.contact_email,
          {
            userName: submission.contact_email.split('@')[0],
            companyName: submission.company_name
          }
        );

        if (result.success) {
          toast({
            title: "Welcome Email Sent",
            description: `Welcome email sent to ${submission.contact_email}`,
          });
        } else {
          throw new Error(result.error || 'Failed to send email');
        }
      } catch (error) {
        console.error('Email sending error:', error);
        toast({
          title: "Email Failed",
          description: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Action Logged",
        description: `${action} action recorded for ${submission.company_name}`,
      });
    }
  };

  const LeadEngagementInsights = ({ lead }: { lead: any }) => (
    <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
      <h4 className="font-semibold text-sm flex items-center gap-2">
        <Target className="h-4 w-4" />
        Action Plan Engagement
      </h4>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Engagement Score:</span>
          <span className={`font-medium ${
            getScoreLevel(lead.engagement_score || 0) === 'high' ? 'text-revenue-success' :
            getScoreLevel(lead.engagement_score || 0) === 'medium' ? 'text-revenue-warning' :
            'text-muted-foreground'
          }`}>
            {lead.engagement_score || 0}/100
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Actions Checked:</span>
          <span className="font-medium">
            {lead.actions_checked_count || 0}/4
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Time Spent:</span>
          <span className="font-medium">
            {formatDuration(lead.total_time_spent)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Return Visits:</span>
          <span className="font-medium">
            {lead.return_visits || 0}
          </span>
        </div>
      </div>
      
      {lead.high_intent_lead && (
        <div className="bg-revenue-warning/10 border border-revenue-warning/20 rounded p-2 text-xs">
          <div className="flex items-center gap-1 text-revenue-warning font-medium">
            <TrendingUp className="h-3 w-3" />
            🎯 High Intent Lead - Priority Follow-up Recommended
          </div>
        </div>
      )}
      
      {lead.last_action_plan_visit && (
        <div className="text-xs text-muted-foreground">
          Last action plan visit: {formatDate(lead.last_action_plan_visit)}
        </div>
      )}
    </div>
  );

  const QuickActions = ({ lead }: { lead: any }) => (
    <div className="flex flex-col gap-1">
      {lead.high_intent_lead && (
        <Button 
          size="sm" 
          className="bg-revenue-primary text-white text-xs h-7"
          onClick={() => handleQuickAction('Schedule Priority Call', lead)}
        >
          <Phone className="h-3 w-3 mr-1" />
          Priority Call
        </Button>
      )}
      <Button 
        variant="outline" 
        size="sm"
        className="text-xs h-7"
        onClick={() => handleQuickAction('Send Follow-up Email', lead)}
      >
        <Mail className="h-3 w-3 mr-1" />
        Follow-up
      </Button>
      {(lead.engagement_score || 0) < 30 && (
        <Button 
          variant="secondary" 
          size="sm"
          className="text-xs h-7"
          onClick={() => handleQuickAction('Add to Nurture Campaign', lead)}
        >
          <UserPlus className="h-3 w-3 mr-1" />
          Nurture
        </Button>
      )}
    </div>
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return 'text-revenue-danger';
    if (score >= 60) return 'text-revenue-warning';
    if (score >= 40) return 'text-yellow-500';
    return 'text-revenue-success';
  };

  const handleRecalculateScore = async (submissionId: string) => {
    setRecalculatingScores(prev => new Set([...prev, submissionId]));
    try {
      const response = await leadScoringService.recalculateScore(submissionId);
      if (response.error) {
        throw response.error;
      }
      
      // Update the submission in state
      setSubmissions(prev => prev.map(sub => 
        sub.id === submissionId 
          ? { ...sub, lead_score: response.data?.lead_score, updated_at: response.data?.updated_at }
          : sub
      ));
      
      toast({
        title: "Score Updated",
        description: `Lead score recalculated to ${response.data?.lead_score}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to recalculate lead score",
        variant: "destructive",
      });
    } finally {
      setRecalculatingScores(prev => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
    }
  };

  const getScoreStatus = (submission: any) => {
    const score = submission.lead_score || 0;
    const isLegacy = score === 0;
    return {
      isLegacy,
      status: isLegacy ? 'Legacy' : 'Calculated',
      lastUpdated: submission.updated_at ? new Date(submission.updated_at).toLocaleDateString() : 'Unknown'
    };
  };

  const industries = [...new Set(submissions.map(s => s.industry).filter(Boolean))];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Lead Management</h1>
          <p className="text-muted-foreground">
            Manage and track revenue leak calculator submissions ({filteredSubmissions.length} leads)
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              if (filteredSubmissions.length > 0) {
                handleQuickAction('Test Welcome Email', filteredSubmissions[0]);
              }
            }}
            className="bg-revenue-success text-white"
            disabled={filteredSubmissions.length === 0}
          >
            <Mail className="h-4 w-4 mr-2" />
            Test Email
          </Button>
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies, emails, or users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={engagementFilter} onValueChange={setEngagementFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Engagement level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Engagement</SelectItem>
                <SelectItem value="high">High Intent (70+)</SelectItem>
                <SelectItem value="medium">Medium Intent (40-69)</SelectItem>
                <SelectItem value="low">Low Intent (0-39)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Action level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Action Levels</SelectItem>
                <SelectItem value="active">Active (2+ actions)</SelectItem>
                <SelectItem value="started">Started (1 action)</SelectItem>
                <SelectItem value="viewing">Viewing Only (0)</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline"
              onClick={() => {
                setSortField('engagement_score');
                setSortDirection('desc');
              }}
              className="whitespace-nowrap"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Sort by Engagement
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-revenue-success/20 bg-revenue-success/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-revenue-success" />
              <div>
                <div className="text-2xl font-bold text-revenue-success">
                  {filteredSubmissions.filter(s => (s.engagement_score || 0) >= 70).length}
                </div>
                <div className="text-sm text-muted-foreground">High Intent Leads</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-revenue-warning/20 bg-revenue-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-revenue-warning" />
              <div>
                <div className="text-2xl font-bold text-revenue-warning">
                  {filteredSubmissions.filter(s => (s.actions_checked_count || 0) >= 2).length}
                </div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold text-primary">
                  {Math.round(filteredSubmissions.reduce((sum, s) => sum + (s.total_time_spent || 0), 0) / 60)}
                </div>
                <div className="text-sm text-muted-foreground">Total Hours Engaged</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-muted bg-muted/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">
                  {filteredSubmissions.filter(s => s.return_visits && s.return_visits > 0).length}
                </div>
                <div className="text-sm text-muted-foreground">Return Visitors</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Table */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>Lead Submissions</CardTitle>
          <CardDescription>
            Complete list of revenue leak calculator submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('company_name')}
                      className="p-0 h-auto font-medium"
                    >
                      Company
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('user_email')}
                      className="p-0 h-auto font-medium"
                    >
                      Submitted By
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('current_arr')}
                      className="p-0 h-auto font-medium"
                    >
                      ARR
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('total_leak')}
                      className="p-0 h-auto font-medium"
                    >
                      Leakage
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('lead_score')}
                      className="p-0 h-auto font-medium"
                    >
                      Lead Score
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                   <TableHead>
                     <Button 
                       variant="ghost" 
                       onClick={() => handleSort('engagement_score')}
                       className="p-0 h-auto font-medium"
                     >
                       Engagement
                       <ArrowUpDown className="ml-2 h-4 w-4" />
                     </Button>
                   </TableHead>
                   <TableHead>
                     <Button 
                       variant="ghost" 
                       onClick={() => handleSort('created_at')}
                       className="p-0 h-auto font-medium"
                     >
                       Date
                       <ArrowUpDown className="ml-2 h-4 w-4" />
                     </Button>
                   </TableHead>
                   <TableHead>Score Status</TableHead>
                   <TableHead>Quick Actions</TableHead>
                   <TableHead>Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id} className={submission.high_intent_lead ? 'bg-revenue-success/5 border-l-4 border-l-revenue-success' : ''}>
                      <TableCell>
                        <div className="space-y-2">
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {submission.company_name}
                              {submission.high_intent_lead && (
                                <Badge variant="default" className="bg-revenue-success text-xs">
                                  High Intent
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{submission.contact_email}</div>
                          </div>
                          <LeadEngagementInsights lead={submission} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{submission.user_email || 'Unknown User'}</div>
                          <div className="text-sm text-muted-foreground">
                            {submission.user_company_name || 'No company set'}
                            {submission.user_total_submissions > 1 && (
                              <span className="ml-2 text-xs bg-revenue-primary text-white px-1 rounded">
                                {submission.user_total_submissions} submissions
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {submission.industry && (
                          <Badge variant="outline" className="capitalize">
                            {submission.industry}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(submission.current_arr || 0)}</TableCell>
                      <TableCell className="text-revenue-danger">
                        {formatCurrency(submission.total_leak || 0)}
                      </TableCell>
                       <TableCell>
                         <div className="flex items-center gap-2">
                           <span className={`font-bold ${getLeadScoreColor(submission.lead_score || 0)}`}>
                             {submission.lead_score || 0}
                           </span>
                            {(submission.lead_score || 0) === 0 && (
                              <div title="Score needs calculation">
                                <AlertCircle className="h-4 w-4 text-revenue-warning" />
                              </div>
                            )}
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="space-y-1">
                           <div className={`text-sm font-medium ${
                             getEngagementLevel(submission.engagement_score || 0) === 'high' ? 'text-revenue-success' :
                             getEngagementLevel(submission.engagement_score || 0) === 'medium' ? 'text-revenue-warning' :
                             'text-muted-foreground'
                           }`}>
                             {submission.engagement_score || 0}/100
                           </div>
                           <div className="text-xs text-muted-foreground">
                             {submission.actions_checked_count || 0} actions
                           </div>
                         </div>
                       </TableCell>
                       <TableCell className="text-muted-foreground">
                         {submission.created_at ? 
                           new Date(submission.created_at).toLocaleDateString() : 
                           'N/A'
                         }
                       </TableCell>
                       <TableCell>
                         {(() => {
                           const scoreStatus = getScoreStatus(submission);
                           return (
                             <div className="flex flex-col gap-1">
                               <Badge 
                                 variant={scoreStatus.isLegacy ? "destructive" : "outline"}
                                 className="w-fit"
                               >
                                 {scoreStatus.status}
                               </Badge>
                               <span className="text-xs text-muted-foreground">
                                 Updated: {scoreStatus.lastUpdated}
                               </span>
                             </div>
                           );
                         })()}
                       </TableCell>
                       <TableCell>
                         <QuickActions lead={submission} />
                       </TableCell>
                       <TableCell>
                         <div className="flex gap-2">
                           <Link to={`/results/${submission.id}`}>
                             <Button variant="outline" size="sm">
                               <Eye className="h-4 w-4" />
                             </Button>
                           </Link>
                           <Button 
                             variant="outline" 
                             size="sm"
                             onClick={() => handleRecalculateScore(submission.id)}
                             disabled={recalculatingScores.has(submission.id)}
                             title="Recalculate Score"
                           >
                             <RefreshCw className={`h-4 w-4 ${recalculatingScores.has(submission.id) ? 'animate-spin' : ''}`} />
                           </Button>
                         </div>
                       </TableCell>
                    </TableRow>
                  ))}
               </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLeads;