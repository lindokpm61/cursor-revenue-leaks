import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Search, Users, Building, TrendingUp, Crown,
  ArrowUpDown, Filter
} from "lucide-react";
import { userProfileService, submissionService } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const AdminUsers = () => {
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    consultants: 0,
    enterprises: 0,
    totalAnalyses: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [userProfiles, searchTerm, userTypeFilter, sortField, sortDirection]);

  const loadUserData = async () => {
    try {
      // Get all submissions to map user data
      const submissionsResponse = await submissionService.getAll(1000);
      
      if (submissionsResponse.data) {
        const submissions = submissionsResponse.data;
        
        // Group submissions by user_id to create user profiles
        const userMap = new Map();
        
        submissions.forEach(sub => {
          const userId = sub.user_id;
          if (!userId) return;
          
          if (!userMap.has(userId)) {
            userMap.set(userId, {
              id: userId,
              email: sub.contact_email,
              company_name: sub.company_name,
              user_type: 'standard', // Default
              companies_analyzed: 0,
              total_opportunity: 0,
              last_analysis_date: sub.created_at,
              created_at: sub.created_at,
              submissions: []
            });
          }
          
          const user = userMap.get(userId);
          user.submissions.push(sub);
          user.companies_analyzed = user.submissions.length;
          user.total_opportunity += sub.recovery_potential_70 || 0;
          
          // Update last analysis date if this submission is newer
          if (new Date(sub.created_at!) > new Date(user.last_analysis_date)) {
            user.last_analysis_date = sub.created_at;
          }
          
          // Determine user type based on patterns
          if (user.companies_analyzed >= 5) {
            user.user_type = 'consultant';
          } else if ((sub.current_arr || 0) > 10000000) {
            user.user_type = 'enterprise';
          } else if ((sub.recovery_potential_70 || 0) > 1000000) {
            user.user_type = 'investor';
          }
        });
        
        const users = Array.from(userMap.values());
        setUserProfiles(users);
        
        // Calculate stats
        setUserStats({
          totalUsers: users.length,
          consultants: users.filter(u => u.user_type === 'consultant').length,
          enterprises: users.filter(u => u.user_type === 'enterprise').length,
          totalAnalyses: users.reduce((acc, u) => acc + u.companies_analyzed, 0),
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortUsers = () => {
    let filtered = [...userProfiles];

    // Apply filters
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (userTypeFilter !== "all") {
      filtered = filtered.filter(user => user.user_type === userTypeFilter);
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

    setFilteredUsers(filtered);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getUserTypeBadge = (userType: string) => {
    const variants = {
      consultant: { variant: 'default' as const, icon: Crown },
      enterprise: { variant: 'secondary' as const, icon: Building },
      investor: { variant: 'outline' as const, icon: TrendingUp },
      standard: { variant: 'outline' as const, icon: Users },
    };
    
    const config = variants[userType as keyof typeof variants] || variants.standard;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {userType}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">
          Manage users and analyze engagement patterns ({filteredUsers.length} users)
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{userStats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Consultants</p>
                <p className="text-2xl font-bold text-revenue-primary">{userStats.consultants}</p>
              </div>
              <Crown className="h-8 w-8 text-revenue-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enterprise Users</p>
                <p className="text-2xl font-bold text-revenue-success">{userStats.enterprises}</p>
              </div>
              <Building className="h-8 w-8 text-revenue-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Analyses</p>
                <p className="text-2xl font-bold text-revenue-warning">{userStats.totalAnalyses}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-revenue-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by email or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by user type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All User Types</SelectItem>
                <SelectItem value="consultant">Consultants</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="investor">Investors</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>
            Complete list of users and their engagement metrics
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
                      onClick={() => handleSort('email')}
                      className="p-0 h-auto font-medium"
                    >
                      User
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('companies_analyzed')}
                      className="p-0 h-auto font-medium"
                    >
                      Analyses
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('total_opportunity')}
                      className="p-0 h-auto font-medium"
                    >
                      Total Opportunity
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('last_analysis_date')}
                      className="p-0 h-auto font-medium"
                    >
                      Last Analysis
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('created_at')}
                      className="p-0 h-auto font-medium"
                    >
                      Joined
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.email}</div>
                        <div className="text-sm text-muted-foreground">{user.company_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getUserTypeBadge(user.user_type)}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{user.companies_analyzed}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-revenue-primary">
                        {formatCurrency(user.total_opportunity)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.last_analysis_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
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

export default AdminUsers;