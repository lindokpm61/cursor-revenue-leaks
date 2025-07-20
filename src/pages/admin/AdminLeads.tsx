// Temporarily disabled - references non-existent tables
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "@/layouts/AdminLayout";

export default function AdminLeads() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
        <p className="text-muted-foreground">Lead management and scoring</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Service Temporarily Disabled</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The leads feature is temporarily disabled while we update the database schema.</p>
        </CardContent>
      </Card>
    </div>
  );
}