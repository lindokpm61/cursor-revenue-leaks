import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, Filter, Download, Eye, ArrowUpDown, RefreshCw, AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { submissionService, leadScoringService } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const AdminLeads = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculatingScores, setRecalculatingScores] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();

  useEffect(() => {
    loadSubmissions();
  }, []);

  useEffect(() => {
    filterAndSortSubmissions();
  }, [submissions, searchTerm, industryFilter, statusFilter, sortField, sortDirection]);

  const loadSubmissions = async () => {
    try {
      const response = await submissionService.getAll(100);
      if (response.data) {
        setSubmissions(response.data);
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
        sub.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (industryFilter !== "all") {
      filtered = filtered.filter(sub => sub.industry === industryFilter);
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
      'Company Name,Email,Industry,Current ARR,Total Leakage,Recovery Potential,Lead Score,Created Date',
      ...filteredSubmissions.map(sub => [
        sub.company_name,
        sub.contact_email,
        sub.industry || '',
        sub.current_arr || 0,
        sub.total_leak || 0,
        sub.recovery_potential_70 || 0,
        sub.lead_score || 0,
        sub.created_at || ''
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
        <Button onClick={exportData} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border/50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies or emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
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
          </div>
        </CardContent>
      </Card>

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
                      onClick={() => handleSort('created_at')}
                      className="p-0 h-auto font-medium"
                    >
                      Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                     </TableHead>
                   <TableHead>Score Status</TableHead>
                   <TableHead>Actions</TableHead>
                 </TableRow>
               </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{submission.company_name}</div>
                        <div className="text-sm text-muted-foreground">{submission.contact_email}</div>
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