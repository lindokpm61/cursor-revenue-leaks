import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Search, Users, Building, TrendingUp, Crown, Shield, Clock,
  ArrowUpDown, Filter, CheckCircle, XCircle, AlertCircle, UserCheck, Trash2
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { userService } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface UserWithAnalytics {
  user_id: string;
  email: string;
  created_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  user_role: string;
  user_company: string | null;
  user_type: string;
  total_submissions: number;
  companies_analyzed: number;
  first_submission_date: string | null;
  last_submission_date: string | null;
  avg_lead_score: number;
  total_pipeline_value: number;
  account_status: string;
}

const AdminUsers = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithAnalytics[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithAnalytics[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    verifiedUsers: 0,
    consultants: 0,
    enterprises: 0,
    totalSubmissions: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchTerm, userTypeFilter, statusFilter, sortField, sortDirection]);

  const loadUserData = async () => {
    try {
      const response = await userService.getUsersWithAnalytics(500);
      
      if (response.error) {
        throw response.error;
      }

      if (response.data) {
        setUsers(response.data);
        
        // Calculate comprehensive stats
        const totalUsers = response.data.length;
        const activeUsers = response.data.filter(u => u.account_status === 'active').length;
        const verifiedUsers = response.data.filter(u => u.email_confirmed_at !== null).length;
        const consultants = response.data.filter(u => u.companies_analyzed >= 3).length;
        const enterprises = response.data.filter(u => u.user_type === 'enterprise' || u.total_pipeline_value > 5000000).length;
        const totalSubmissions = response.data.reduce((acc, u) => acc + u.total_submissions, 0);
        
        setUserStats({
          totalUsers,
          activeUsers,
          verifiedUsers,
          consultants,
          enterprises,
          totalSubmissions,
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
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
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.user_company && user.user_company.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply user type filter
    if (userTypeFilter !== "all") {
      if (userTypeFilter === "consultant") {
        filtered = filtered.filter(user => user.companies_analyzed >= 3);
      } else if (userTypeFilter === "enterprise") {
        filtered = filtered.filter(user => user.user_type === 'enterprise' || user.total_pipeline_value > 5000000);
      } else {
        filtered = filtered.filter(user => user.user_type === userTypeFilter);
      }
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(user => user.account_status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField as keyof UserWithAnalytics];
      let bValue = b[sortField as keyof UserWithAnalytics];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getAccountStatusBadge = (status: string, emailConfirmed: boolean) => {
    if (!emailConfirmed) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Unverified
      </Badge>;
    }
    
    switch (status) {
      case 'active':
        return <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Active
        </Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Inactive
        </Badge>;
      case 'pending_verification':
        return <Badge variant="outline" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Pending
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUserTypeBadge = (user: UserWithAnalytics) => {
    // Determine user type based on activity patterns and new classification
    const isConsultant = user.companies_analyzed >= 3;
    const isEnterprise = user.user_type === 'enterprise' || user.total_pipeline_value > 5000000;
    const isAdmin = user.user_role === 'admin';
    const isInvestor = user.companies_analyzed >= 4 && user.total_pipeline_value > 20000000;
    
    if (isAdmin) {
      return <Badge variant="default" className="flex items-center gap-1">
        <Shield className="h-3 w-3" />
        Admin
      </Badge>;
    }
    
    if (isInvestor) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <TrendingUp className="h-3 w-3" />
        Investor/PE
      </Badge>;
    }
    
    if (isConsultant) {
      return <Badge variant="secondary" className="flex items-center gap-1">
        <Crown className="h-3 w-3" />
        Consultant
      </Badge>;
    }
    
    if (isEnterprise) {
      return <Badge variant="outline" className="flex items-center gap-1">
        <Building className="h-3 w-3" />
        Enterprise
      </Badge>;
    }
    
    return <Badge variant="outline" className="flex items-center gap-1">
      <Users className="h-3 w-3" />
      Standard
    </Badge>;
  };

  const getBusinessModelBadge = (user: UserWithAnalytics) => {
    // This would come from the enhanced user_profiles table
    const businessModel = user.user_type; // Placeholder - would be actual business_model field
    
    switch (businessModel) {
      case 'consulting':
        return <Badge variant="outline" className="text-xs">Consulting</Badge>;
      case 'investment':
        return <Badge variant="outline" className="text-xs">Investment</Badge>;
      case 'internal':
        return <Badge variant="outline" className="text-xs">Internal</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Business</Badge>;
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    try {
      const response = await userService.deleteUser(userId);
      
      if (response.error) {
        throw response.error;
      }

      // Remove user from local state
      setUsers(prev => prev.filter(u => u.user_id !== userId));
      
      toast({
        title: "Success",
        description: `User ${email} has been deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
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
          Manage user accounts and analyze user engagement patterns ({filteredUsers.length} users)
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-xl font-bold">{userStats.totalUsers}</p>
              </div>
              <Users className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-xl font-bold text-revenue-success">{userStats.activeUsers}</p>
              </div>
              <UserCheck className="h-6 w-6 text-revenue-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-xl font-bold text-blue-500">{userStats.verifiedUsers}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Consultants</p>
                <p className="text-xl font-bold text-revenue-primary">{userStats.consultants}</p>
              </div>
              <Crown className="h-6 w-6 text-revenue-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enterprise</p>
                <p className="text-xl font-bold text-revenue-warning">{userStats.enterprises}</p>
              </div>
              <Building className="h-6 w-6 text-revenue-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Submissions</p>
                <p className="text-xl font-bold text-purple-500">{userStats.totalSubmissions}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-purple-500" />
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
                  placeholder="Search by email or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="consultant">Consultants</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Account Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending_verification">Pending</SelectItem>
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
            Complete list of registered users with account details and activity metrics
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
                      User Details
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('companies_analyzed')}
                      className="p-0 h-auto font-medium"
                    >
                      Companies
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('total_submissions')}
                      className="p-0 h-auto font-medium"
                    >
                      Submissions
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('total_pipeline_value')}
                      className="p-0 h-auto font-medium"
                    >
                      Pipeline Value
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('created_at')}
                      className="p-0 h-auto font-medium"
                    >
                      Registered
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.email}</div>
                        {user.user_company && (
                          <div className="text-sm text-muted-foreground">{user.user_company}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getAccountStatusBadge(user.account_status, !!user.email_confirmed_at)}
                    </TableCell>
                    <TableCell>
                      {getUserTypeBadge(user)}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{user.companies_analyzed}</span>
                      {user.companies_analyzed >= 3 && (
                        <div className="text-xs text-revenue-primary">Multi-company</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{user.total_submissions}</span>
                      {user.avg_lead_score > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Avg Score: {Math.round(user.avg_lead_score)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-revenue-primary">
                        {formatCurrency(user.total_pipeline_value)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex flex-col gap-1">
                        <div className="text-sm">
                          Login: {formatDate(user.last_sign_in_at)}
                        </div>
                        {user.last_submission_date && (
                          <div className="text-xs">
                            Analysis: {formatDate(user.last_submission_date)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            disabled={user.user_role === 'admin'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete user <strong>{user.email}</strong>? 
                              This action cannot be undone and will permanently delete:
                              <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>User account and profile</li>
                                <li>{user.total_submissions} submission(s)</li>
                                <li>All related analytics and engagement data</li>
                              </ul>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.user_id, user.email)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete User
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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