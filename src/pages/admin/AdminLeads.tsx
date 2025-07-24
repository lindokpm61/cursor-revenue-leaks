
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, TrendingUp, Star, Filter, Search, Download } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AdminLeads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [scoreFilter, setScoreFilter] = useState("all");

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['admin-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('temporary_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    }
  });

  const { data: convertedLeads } = useQuery({
    queryKey: ['admin-converted-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calculator_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    }
  });

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    if (score >= 40) return "outline";
    return "destructive";
  };

  const filteredSubmissions = submissions?.filter(sub => {
    const matchesSearch = !searchTerm || 
      sub.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesScore = scoreFilter === "all" || 
      (scoreFilter === "high" && (sub.lead_score || 0) >= 80) ||
      (scoreFilter === "medium" && (sub.lead_score || 0) >= 40 && (sub.lead_score || 0) < 80) ||
      (scoreFilter === "low" && (sub.lead_score || 0) < 40);
    
    return matchesSearch && matchesScore;
  });

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">Lead management and scoring</p>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          Export Leads
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertedLeads?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Score Leads</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submissions?.filter(s => (s.lead_score || 0) >= 80).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Quality leads ready for outreach
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Lead Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submissions?.length ? 
                Math.round(submissions.reduce((acc, s) => acc + (s.lead_score || 0), 0) / submissions.length) : 
                0
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Across all leads
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Leads</TabsTrigger>
            <TabsTrigger value="converted">Converted</TabsTrigger>
            <TabsTrigger value="high-score">High Score</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Select value={scoreFilter} onValueChange={setScoreFilter}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scores</SelectItem>
                <SelectItem value="high">High (80+)</SelectItem>
                <SelectItem value="medium">Medium (40-79)</SelectItem>
                <SelectItem value="low">Low (0-39)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Leads</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading leads...</div>
              ) : (
                <div className="space-y-4">
                  {filteredSubmissions?.map((submission) => (
                    <div key={submission.temp_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-semibold">{submission.company_name || 'Unknown Company'}</h3>
                            <p className="text-sm text-muted-foreground">{submission.email}</p>
                          </div>
                          <Badge variant={getScoreBadgeColor(submission.lead_score || 0)}>
                            Score: {submission.lead_score || 0}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {submission.recovery_potential ? 
                            `$${Math.round(submission.recovery_potential).toLocaleString()}` : 
                            'No calculation'
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(submission.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="converted">
          <Card>
            <CardHeader>
              <CardTitle>Converted Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {convertedLeads?.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{lead.company_name}</h3>
                      <p className="text-sm text-muted-foreground">{lead.contact_email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        ${Math.round(lead.recovery_potential_70 || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high-score">
          <Card>
            <CardHeader>
              <CardTitle>High Score Leads (80+)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submissions?.filter(s => (s.lead_score || 0) >= 80).map((submission) => (
                  <div key={submission.temp_id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold">{submission.company_name || 'Unknown Company'}</h3>
                          <p className="text-sm text-muted-foreground">{submission.email}</p>
                        </div>
                        <Badge variant="default">
                          Score: {submission.lead_score}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-700">
                        ${Math.round(submission.recovery_potential || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(submission.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
