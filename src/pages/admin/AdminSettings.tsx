import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, Shield, Mail, Database, Bell, Palette, Globe, 
  Save, RefreshCw, AlertTriangle, CheckCircle, Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SystemSettings {
  siteName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailVerificationRequired: boolean;
  maxFileUploadSize: number;
  sessionTimeout: number;
  defaultUserRole: string;
}

interface IntegrationSettings {
  crmEnabled: boolean;
  emailAutomationEnabled: boolean;
  analyticsEnabled: boolean;
  notificationsEnabled: boolean;
  webhookUrl: string;
  apiRateLimit: number;
}

interface EmailSettings {
  smtpEnabled: boolean;
  fromName: string;
  fromEmail: string;
  welcomeEmailTemplate: string;
  passwordResetTemplate: string;
  notificationEmailTemplate: string;
}

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    siteName: "Revenue Leak Alchemist",
    supportEmail: "support@revenueleakalchemist.com",
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    maxFileUploadSize: 10, // MB
    sessionTimeout: 24, // hours
    defaultUserRole: "user"
  });

  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings>({
    crmEnabled: true,
    emailAutomationEnabled: true,
    analyticsEnabled: true,
    notificationsEnabled: true,
    webhookUrl: "",
    apiRateLimit: 1000
  });

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpEnabled: true,
    fromName: "Revenue Leak Alchemist",
    fromEmail: "noreply@revenueleakalchemist.com",
    welcomeEmailTemplate: "Welcome to Revenue Leak Alchemist! We're excited to help you optimize your revenue streams.",
    passwordResetTemplate: "Click the link below to reset your password. This link will expire in 24 hours.",
    notificationEmailTemplate: "You have new activity in your Revenue Leak Alchemist account."
  });

  const { toast } = useToast();

  const handleSaveSystemSettings = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save system settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIntegrationSettings = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Integration Settings Saved",
        description: "Integration settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save integration settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmailSettings = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Email Settings Saved",
        description: "Email settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save email settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Test Email Sent",
        description: "A test email has been sent to verify your SMTP configuration.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test email. Please check your SMTP settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Settings</h1>
        <p className="text-muted-foreground">
          Configure system-wide settings and integrations
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Configure basic system settings and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={systemSettings.siteName}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, siteName: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={systemSettings.supportEmail}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Max File Upload Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={systemSettings.maxFileUploadSize}
                    onChange={(e) => setSystemSettings(prev => ({ 
                      ...prev, 
                      maxFileUploadSize: parseInt(e.target.value) || 10 
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={systemSettings.sessionTimeout}
                    onChange={(e) => setSystemSettings(prev => ({ 
                      ...prev, 
                      sessionTimeout: parseInt(e.target.value) || 24 
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultRole">Default User Role</Label>
                  <Select 
                    value={systemSettings.defaultUserRole} 
                    onValueChange={(value) => setSystemSettings(prev => ({ ...prev, defaultUserRole: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">System Behavior</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Temporarily disable public access to the system
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {systemSettings.maintenanceMode && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                      <Switch
                        checked={systemSettings.maintenanceMode}
                        onCheckedChange={(checked) => 
                          setSystemSettings(prev => ({ ...prev, maintenanceMode: checked }))
                        }
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>User Registration</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow new users to register accounts
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.registrationEnabled}
                      onCheckedChange={(checked) => 
                        setSystemSettings(prev => ({ ...prev, registrationEnabled: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Verification Required</Label>
                      <p className="text-sm text-muted-foreground">
                        Require email verification for new accounts
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.emailVerificationRequired}
                      onCheckedChange={(checked) => 
                        setSystemSettings(prev => ({ ...prev, emailVerificationRequired: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSystemSettings} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save System Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integration Settings */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Integration Settings
              </CardTitle>
              <CardDescription>
                Configure external integrations and API settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>CRM Integration</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable integration with Twenty CRM for lead management
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {integrationSettings.crmEnabled && (
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                    <Switch
                      checked={integrationSettings.crmEnabled}
                      onCheckedChange={(checked) => 
                        setIntegrationSettings(prev => ({ ...prev, crmEnabled: checked }))
                      }
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Automation</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable automated email sequences and campaigns
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {integrationSettings.emailAutomationEnabled && (
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                    <Switch
                      checked={integrationSettings.emailAutomationEnabled}
                      onCheckedChange={(checked) => 
                        setIntegrationSettings(prev => ({ ...prev, emailAutomationEnabled: checked }))
                      }
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Analytics Tracking</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable detailed analytics and user behavior tracking
                    </p>
                  </div>
                  <Switch
                    checked={integrationSettings.analyticsEnabled}
                    onCheckedChange={(checked) => 
                      setIntegrationSettings(prev => ({ ...prev, analyticsEnabled: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable system-wide notifications and alerts
                    </p>
                  </div>
                  <Switch
                    checked={integrationSettings.notificationsEnabled}
                    onCheckedChange={(checked) => 
                      setIntegrationSettings(prev => ({ ...prev, notificationsEnabled: checked }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    placeholder="https://api.example.com/webhook"
                    value={integrationSettings.webhookUrl}
                    onChange={(e) => setIntegrationSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional webhook URL for external notifications
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="apiRateLimit">API Rate Limit (per hour)</Label>
                  <Input
                    id="apiRateLimit"
                    type="number"
                    value={integrationSettings.apiRateLimit}
                    onChange={(e) => setIntegrationSettings(prev => ({ 
                      ...prev, 
                      apiRateLimit: parseInt(e.target.value) || 1000 
                    }))}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveIntegrationSettings} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Integration Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>
                Configure SMTP settings and email templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMTP Email Service</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable SMTP email delivery
                    </p>
                  </div>
                  <Switch
                    checked={emailSettings.smtpEnabled}
                    onCheckedChange={(checked) => 
                      setEmailSettings(prev => ({ ...prev, smtpEnabled: checked }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, fromName: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-6">
                <h3 className="text-lg font-medium">Email Templates</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="welcomeTemplate">Welcome Email Template</Label>
                    <Textarea
                      id="welcomeTemplate"
                      rows={3}
                      value={emailSettings.welcomeEmailTemplate}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, welcomeEmailTemplate: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="passwordResetTemplate">Password Reset Template</Label>
                    <Textarea
                      id="passwordResetTemplate"
                      rows={3}
                      value={emailSettings.passwordResetTemplate}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, passwordResetTemplate: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notificationTemplate">Notification Template</Label>
                    <Textarea
                      id="notificationTemplate"
                      rows={3}
                      value={emailSettings.notificationEmailTemplate}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, notificationEmailTemplate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleTestEmail} disabled={loading || !emailSettings.smtpEnabled}>
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Send Test Email
                </Button>
                
                <Button onClick={handleSaveEmailSettings} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Email Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Privacy
              </CardTitle>
              <CardDescription>
                Configure security policies and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Security Notice</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Security settings are managed through Supabase's built-in authentication and security features. 
                      Critical security configurations should be managed directly in the Supabase dashboard.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Authentication Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Authentication settings can be configured in the Supabase Dashboard under Authentication → Settings.
                  This includes password policies, session management, and multi-factor authentication options.
                </p>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Data Privacy</h3>
                <p className="text-sm text-muted-foreground">
                  User data is handled according to our privacy policy. All personal information is encrypted and 
                  stored securely. Users have the right to request data deletion as implemented in the user management system.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;