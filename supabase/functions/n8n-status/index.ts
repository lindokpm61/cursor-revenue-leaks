import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching N8N integration status...');

    // Get email sequence status
    const emailSequenceStatus = await getEmailSequenceStatus(supabase);
    
    // Get CRM integration status
    const crmIntegrationStatus = await getCRMIntegrationStatus(supabase);
    
    // Get pending workflow count
    const pendingWorkflowCount = await getPendingWorkflowCount(supabase);
    
    // Get last maintenance time
    const lastMaintenanceTime = await getLastMaintenanceTime(supabase);

    const status = {
      email_sequences: emailSequenceStatus,
      crm_integration: crmIntegrationStatus,
      pending_workflows: pendingWorkflowCount,
      last_maintenance: lastMaintenanceTime,
      timestamp: new Date().toISOString(),
      system_health: 'operational'
    };

    return new Response(
      JSON.stringify(status),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('N8N status check error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        system_health: 'degraded',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function getEmailSequenceStatus(supabase: any) {
  try {
    // Get email sequence statistics
    const { data: queueStats } = await supabase
      .from('email_sequence_queue')
      .select('status, sequence_type')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (!queueStats) return { status: 'unknown', stats: {} };

    const stats = queueStats.reduce((acc: any, item: any) => {
      const key = `${item.sequence_type}_${item.status}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // Get recent email sequence analytics
    const { data: analytics } = await supabase
      .from('email_sequence_analytics')
      .select('*')
      .order('week', { ascending: false })
      .limit(1)
      .single();

    return {
      status: 'active',
      last_24h_stats: stats,
      recent_performance: analytics || null,
      total_queued: queueStats.filter((item: any) => item.status === 'pending').length,
      total_sent_24h: queueStats.filter((item: any) => item.status === 'sent').length
    };
  } catch (error) {
    console.error('Error getting email sequence status:', error);
    return { status: 'error', error: error.message };
  }
}

async function getCRMIntegrationStatus(supabase: any) {
  try {
    // Get recent CRM integration logs
    const { data: crmLogs } = await supabase
      .from('integration_logs')
      .select('*')
      .eq('integration_type', 'twenty_crm')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (!crmLogs) return { status: 'unknown', stats: {} };

    const successCount = crmLogs.filter(log => log.status === 'success').length;
    const errorCount = crmLogs.filter(log => log.status === 'error').length;
    const totalCalls = crmLogs.length;

    // Get recent submissions with CRM sync status
    const { data: syncedSubmissions } = await supabase
      .from('submissions')
      .select('twenty_contact_id, synced_to_self_hosted')
      .not('twenty_contact_id', 'is', null)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    return {
      status: errorCount / Math.max(totalCalls, 1) > 0.1 ? 'degraded' : 'active',
      last_24h_calls: totalCalls,
      success_rate: totalCalls > 0 ? (successCount / totalCalls * 100).toFixed(1) + '%' : 'N/A',
      synced_submissions_24h: syncedSubmissions?.length || 0,
      recent_errors: crmLogs.filter(log => log.status === 'error').slice(0, 5)
    };
  } catch (error) {
    console.error('Error getting CRM integration status:', error);
    return { status: 'error', error: error.message };
  }
}

async function getPendingWorkflowCount(supabase: any) {
  try {
    // Count pending email sequences
    const { count: pendingEmails } = await supabase
      .from('email_sequence_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Count recent temporary submissions without complete workflow processing
    const { count: incompleteWorkflows } = await supabase
      .from('temporary_submissions')
      .select('*', { count: 'exact', head: true })
      .is('converted_to_user_id', null)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    return {
      pending_email_sequences: pendingEmails || 0,
      incomplete_workflows_24h: incompleteWorkflows || 0,
      total_pending: (pendingEmails || 0) + (incompleteWorkflows || 0)
    };
  } catch (error) {
    console.error('Error getting pending workflow count:', error);
    return { error: error.message };
  }
}

async function getLastMaintenanceTime(supabase: any) {
  try {
    // Check for recent maintenance logs
    const { data: maintenanceLogs } = await supabase
      .from('integration_logs')
      .select('created_at')
      .eq('integration_type', 'database_maintenance')
      .order('created_at', { ascending: false })
      .limit(1);

    const lastMaintenance = maintenanceLogs?.[0]?.created_at;

    if (lastMaintenance) {
      const timeSince = Date.now() - new Date(lastMaintenance).getTime();
      const hoursSince = Math.floor(timeSince / (1000 * 60 * 60));
      
      return {
        last_run: lastMaintenance,
        hours_since_last_run: hoursSince,
        status: hoursSince > 48 ? 'overdue' : 'current'
      };
    }

    return {
      last_run: null,
      status: 'no_history'
    };
  } catch (error) {
    console.error('Error getting last maintenance time:', error);
    return { error: error.message };
  }
}