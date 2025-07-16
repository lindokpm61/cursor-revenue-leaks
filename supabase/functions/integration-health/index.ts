import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthStatus {
  healthy: boolean;
  status?: number;
  error?: string;
  response_time?: number;
}

interface SystemHealth {
  database: HealthStatus;
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  active_connections?: number;
}

interface IntegrationHealth {
  timestamp: string;
  integrations: {
    n8n: HealthStatus;
    twenty_crm: HealthStatus;
    smartlead: HealthStatus;
    supabase: HealthStatus;
  };
  system: SystemHealth;
  recent_activity: {
    workflows_triggered_24h: number;
    emails_sent_24h: number;
    crm_syncs_24h: number;
    errors_24h: number;
    avg_response_time_ms: number;
    uptime_percentage: number;
  };
  overall_status: string;
  alerts: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseClient = createClient(
      supabaseUrl, 
      supabaseKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    console.log('Checking integration health status...');
    
    const systemHealth = await checkSystemHealth(supabaseClient);
    const activityMetrics = await getActivityMetrics(supabaseClient);
    
    const healthStatus: IntegrationHealth = {
      timestamp: new Date().toISOString(),
      integrations: {
        n8n: await checkN8NHealth(),
        twenty_crm: await checkTwentyCRMHealth(),
        smartlead: await checkSmartleadHealth(),
        supabase: systemHealth.database
      },
      system: systemHealth,
      recent_activity: activityMetrics,
      overall_status: 'healthy',
      alerts: []
    };
    
    // Determine overall health and generate alerts
    const allIntegrations = Object.values(healthStatus.integrations);
    const unhealthyCount = allIntegrations.filter(integration => !integration.healthy).length;
    const systemIssues = checkSystemIssues(healthStatus);
    
    healthStatus.alerts = generateAlerts(healthStatus);
    
    if (unhealthyCount === 0 && systemIssues.length === 0) {
      healthStatus.overall_status = 'healthy';
    } else if (unhealthyCount <= 1 && systemIssues.length <= 1) {
      healthStatus.overall_status = 'degraded';
    } else {
      healthStatus.overall_status = 'unhealthy';
    }
    
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

    const response = await fetch(`${baseUrl}/healthz`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('N8N_API_KEY')}`,
      },
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return { 
        healthy: false, 
        status: response.status, 
        error: `HTTP ${response.status}`,
        response_time: responseTime 
      };
    }

    return { 
      healthy: true, 
      status: response.status,
      response_time: responseTime 
    };
  } catch (error) {
    return { 
      healthy: false, 
      error: error.message 
    };
  }
}

async function checkTwentyCRMHealth(): Promise<HealthStatus> {
  try {
    const startTime = Date.now();
    const baseUrl = Deno.env.get('TWENTY_CRM_BASE_URL');
    const apiKey = Deno.env.get('TWENTY_CRM_API_KEY');
    
    if (!baseUrl || !apiKey) {
      return { healthy: false, error: 'Twenty CRM credentials not configured' };
    }

    const response = await fetch(`${baseUrl}/rest/companies?limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return { 
        healthy: false, 
        status: response.status, 
        error: `HTTP ${response.status}`,
        response_time: responseTime 
      };
    }

    return { 
      healthy: true, 
      status: response.status,
      response_time: responseTime 
    };
  } catch (error) {
    return { 
      healthy: false, 
      error: error.message 
    };
  }
}

async function checkSmartleadHealth(): Promise<HealthStatus> {
  try {
    const startTime = Date.now();
    const apiKey = Deno.env.get('SMARTLEAD_API_KEY');
    const apiUrl = Deno.env.get('SMARTLEAD_API_URL');
    
    if (!apiKey || !apiUrl) {
      return { healthy: false, error: 'Smartlead credentials not configured' };
    }

    const response = await fetch(`${apiUrl}/api/v1/campaigns?limit=1&api_key=${apiKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return { 
        healthy: false, 
        status: response.status, 
        error: `HTTP ${response.status}`,
        response_time: responseTime 
      };
    }

    return { 
      healthy: true, 
      status: response.status,
      response_time: responseTime 
    };
  } catch (error) {
    return { 
      healthy: false, 
      error: error.message 
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
      .not('sent_at', 'is', null)
      .gte('sent_at', since);
    
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
      .from('integration_logs')
      .select('*', { count: 'exact', head: true })
      .eq('integration_type', 'twenty_crm')
      .eq('status', 'success')
      .gte('created_at', since);
    
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

async function checkSystemHealth(supabaseClient: any): Promise<SystemHealth> {
  const startTime = Date.now();
  
  try {
    // Test database connectivity and performance
    const { data, error } = await supabaseClient
      .from('submissions')
      .select('count')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      return {
        database: { 
          healthy: false, 
          error: error.message,
          response_time: responseTime 
        }
      };
    }

    return {
      database: { 
        healthy: true, 
        status: 200,
        response_time: responseTime 
      }
    };
  } catch (error) {
    return {
      database: { 
        healthy: false, 
        error: error.message,
        response_time: Date.now() - startTime 
      }
    };
  }
}

async function getActivityMetrics(supabaseClient: any) {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  try {
    const [workflows, emails, crmSyncs, errors] = await Promise.all([
      getWorkflowCount(supabaseClient, 24),
      getEmailCount(supabaseClient, 24),
      getCRMSyncCount(supabaseClient, 24),
      getErrorCount(supabaseClient, 24)
    ]);

    // Calculate average response time from recent integration logs
    const { data: recentLogs } = await supabaseClient
      .from('integration_logs')
      .select('response_data')
      .gte('created_at', oneDayAgo.toISOString())
      .limit(100);

    const responseTimes = recentLogs
      ?.map(log => log.response_data?.response_time)
      .filter(time => typeof time === 'number') || [];
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    // Calculate uptime percentage (simplified)
    const totalRequests = workflows + emails + crmSyncs;
    const successfulRequests = totalRequests - errors;
    const uptimePercentage = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;

    return {
      workflows_triggered_24h: workflows,
      emails_sent_24h: emails,
      crm_syncs_24h: crmSyncs,
      errors_24h: errors,
      avg_response_time_ms: Math.round(avgResponseTime),
      uptime_percentage: Math.round(uptimePercentage * 100) / 100
    };
  } catch (error) {
    console.error('Error getting activity metrics:', error);
    return {
      workflows_triggered_24h: 0,
      emails_sent_24h: 0,
      crm_syncs_24h: 0,
      errors_24h: 0,
      avg_response_time_ms: 0,
      uptime_percentage: 0
    };
  }
}

function checkSystemIssues(healthStatus: IntegrationHealth): string[] {
  const issues = [];
  
  if (healthStatus.system.database.response_time && healthStatus.system.database.response_time > 1000) {
    issues.push('Database response time is high');
  }
  
  if (healthStatus.recent_activity.errors_24h > 50) {
    issues.push('High error rate detected');
  }
  
  if (healthStatus.recent_activity.uptime_percentage < 95) {
    issues.push('Low uptime percentage');
  }
  
  return issues;
}

function generateAlerts(healthStatus: IntegrationHealth) {
  const alerts = [];
  const now = new Date().toISOString();
  
  // Critical alerts
  if (!healthStatus.system.database.healthy) {
    alerts.push({
      severity: 'critical' as const,
      message: 'Database connectivity issues detected',
      timestamp: now
    });
  }
  
  if (healthStatus.recent_activity.uptime_percentage < 90) {
    alerts.push({
      severity: 'critical' as const,
      message: `System uptime is below 90% (${healthStatus.recent_activity.uptime_percentage}%)`,
      timestamp: now
    });
  }
  
  // High severity alerts
  if (healthStatus.recent_activity.errors_24h > 100) {
    alerts.push({
      severity: 'high' as const,
      message: `High error rate: ${healthStatus.recent_activity.errors_24h} errors in last 24h`,
      timestamp: now
    });
  }
  
  // Medium severity alerts
  if (healthStatus.recent_activity.avg_response_time_ms > 2000) {
    alerts.push({
      severity: 'medium' as const,
      message: `Slow response times: ${healthStatus.recent_activity.avg_response_time_ms}ms average`,
      timestamp: now
    });
  }
  
  // Integration specific alerts
  Object.entries(healthStatus.integrations).forEach(([name, status]) => {
    if (!status.healthy) {
      alerts.push({
        severity: 'high' as const,
        message: `${name.toUpperCase()} integration is down: ${status.error || 'Unknown error'}`,
        timestamp: now
      });
    }
  });
  
  return alerts;
}