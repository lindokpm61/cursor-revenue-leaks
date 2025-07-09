import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HealthStatus {
  healthy: boolean;
  status?: number;
  error?: string;
  response_time?: number;
}

interface IntegrationHealth {
  timestamp: string;
  integrations: {
    n8n: HealthStatus;
    twenty_crm: HealthStatus;
    smartlead: HealthStatus;
    supabase: HealthStatus;
  };
  recent_activity: {
    workflows_triggered_24h: number;
    emails_sent_24h: number;
    crm_syncs_24h: number;
    errors_24h: number;
  };
  overall_status: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    console.log('Checking integration health status...');
    
    const healthStatus: IntegrationHealth = {
      timestamp: new Date().toISOString(),
      integrations: {
        n8n: await checkN8NHealth(),
        twenty_crm: await checkTwentyCRMHealth(),
        smartlead: await checkSmartleadHealth(),
        supabase: { healthy: true, status: 200 }
      },
      recent_activity: {
        workflows_triggered_24h: await getWorkflowCount(supabaseClient, 24),
        emails_sent_24h: await getEmailCount(supabaseClient, 24),
        crm_syncs_24h: await getCRMSyncCount(supabaseClient, 24),
        errors_24h: await getErrorCount(supabaseClient, 24)
      },
      overall_status: 'healthy'
    };
    
    const overallHealth = Object.values(healthStatus.integrations)
      .every((status: HealthStatus) => status.healthy);
    
    healthStatus.overall_status = overallHealth ? 'healthy' : 'degraded';
    
    console.log(`Integration health check completed. Overall status: ${healthStatus.overall_status}`);
    
    return new Response(
      JSON.stringify(healthStatus),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return new Response(
      JSON.stringify({
        overall_status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function checkN8NHealth(): Promise<HealthStatus> {
  try {
    const startTime = Date.now();
    const baseUrl = Deno.env.get('N8N_BASE_URL');
    
    if (!baseUrl) {
      return { healthy: false, error: 'N8N_BASE_URL not configured' };
    }
    
    const response = await fetch(`${baseUrl}/health`, {
      headers: { 
        'Authorization': `Bearer ${Deno.env.get('N8N_API_KEY')}`,
        'User-Agent': 'Supabase-Health-Check'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    
    return { 
      healthy: response.ok, 
      status: response.status,
      response_time: responseTime
    };
  } catch (error) {
    return { 
      healthy: false, 
      error: error.message,
      response_time: 0
    };
  }
}

async function checkTwentyCRMHealth(): Promise<HealthStatus> {
  try {
    const startTime = Date.now();
    const apiUrl = Deno.env.get('TWENTY_CRM_API_URL');
    
    if (!apiUrl) {
      return { healthy: false, error: 'TWENTY_CRM_API_URL not configured' };
    }
    
    const response = await fetch(`${apiUrl}/health`, {
      headers: { 
        'Authorization': `Bearer ${Deno.env.get('TWENTY_CRM_API_KEY')}`,
        'User-Agent': 'Supabase-Health-Check'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    const responseTime = Date.now() - startTime;
    
    return { 
      healthy: response.ok, 
      status: response.status,
      response_time: responseTime
    };
  } catch (error) {
    return { 
      healthy: false, 
      error: error.message,
      response_time: 0
    };
  }
}

async function checkSmartleadHealth(): Promise<HealthStatus> {
  try {
    const startTime = Date.now();
    const apiUrl = Deno.env.get('SMARTLEAD_API_URL');
    
    if (!apiUrl) {
      return { healthy: false, error: 'SMARTLEAD_API_URL not configured' };
    }
    
    const response = await fetch(`${apiUrl}/health`, {
      headers: { 
        'Authorization': `Bearer ${Deno.env.get('SMARTLEAD_API_KEY')}`,
        'User-Agent': 'Supabase-Health-Check'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    const responseTime = Date.now() - startTime;
    
    return { 
      healthy: response.ok, 
      status: response.status,
      response_time: responseTime
    };
  } catch (error) {
    return { 
      healthy: false, 
      error: error.message,
      response_time: 0
    };
  }
}

async function getWorkflowCount(supabaseClient: any, hours: number): Promise<number> {
  try {
    const since = new Date(Date.now() - (hours * 60 * 60 * 1000)).toISOString();
    
    const { count, error } = await supabaseClient
      .from('automation_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since);
    
    if (error) {
      console.error('Failed to get workflow count:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Failed to get workflow count:', error);
    return 0;
  }
}

async function getEmailCount(supabaseClient: any, hours: number): Promise<number> {
  try {
    const since = new Date(Date.now() - (hours * 60 * 60 * 1000)).toISOString();
    
    const { count, error } = await supabaseClient
      .from('email_sequence_queue')
      .select('*', { count: 'exact', head: true })
      .gte('sent_at', since)
      .not('sent_at', 'is', null);
    
    if (error) {
      console.error('Failed to get email count:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Failed to get email count:', error);
    return 0;
  }
}

async function getCRMSyncCount(supabaseClient: any, hours: number): Promise<number> {
  try {
    const since = new Date(Date.now() - (hours * 60 * 60 * 1000)).toISOString();
    
    const { count, error } = await supabaseClient
      .from('temporary_submissions')
      .select('*', { count: 'exact', head: true })
      .not('twenty_crm_contact_id', 'is', null)
      .gte('last_updated', since);
    
    if (error) {
      console.error('Failed to get CRM sync count:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Failed to get CRM sync count:', error);
    return 0;
  }
}

async function getErrorCount(supabaseClient: any, hours: number): Promise<number> {
  try {
    const since = new Date(Date.now() - (hours * 60 * 60 * 1000)).toISOString();
    
    const { count, error } = await supabaseClient
      .from('integration_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'error')
      .gte('created_at', since);
    
    if (error) {
      console.error('Failed to get error count:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Failed to get error count:', error);
    return 0;
  }
}