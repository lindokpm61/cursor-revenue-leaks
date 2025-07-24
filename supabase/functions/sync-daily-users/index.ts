import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { syncAll } = await req.json().catch(() => ({ syncAll: false }));
    
    console.log(`Starting ${syncAll ? 'full' : 'daily'} user sync to CRM...`);
    
    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    let usersToFetch;
    
    if (syncAll) {
      // Get all users
      console.log('Fetching all users from database...');
      const { data: allUsers, error: usersError } = await supabaseClient.auth.admin.listUsers({
        page: 1,
        perPage: 10000 // Increase limit for full sync
      });
      
      if (usersError) {
        throw new Error(`Failed to fetch users: ${usersError.message}`);
      }
      
      usersToFetch = allUsers.users;
    } else {
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      console.log(`Checking for users created between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`);
      
      // Query users created today from auth.users
      const { data: newUsers, error: usersError } = await supabaseClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000 // Adjust if you expect more than 1000 users per day
      });
      
      if (usersError) {
        throw new Error(`Failed to fetch users: ${usersError.message}`);
      }
      
      // Filter users created today
      usersToFetch = newUsers.users.filter(user => {
        const createdAt = new Date(user.created_at);
        return createdAt >= startOfDay && createdAt < endOfDay;
      });
    }
    
    console.log(`Found ${usersToFetch.length} users to process`);
    
    if (usersToFetch.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: syncAll ? 'No users found' : 'No new users found for today',
          successCount: 0,
          errorCount: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check which users already have CRM records
    const { data: existingCrmUsers, error: crmError } = await supabaseClient
      .from('crm_persons')
      .select('user_id')
      .in('user_id', usersToFetch.map(u => u.id));
    
    if (crmError) {
      console.error('Error checking existing CRM records:', crmError);
    }
    
    const existingUserIds = new Set(existingCrmUsers?.map(record => record.user_id) || []);
    const usersToProcess = syncAll ? 
      usersToFetch.filter(user => !existingUserIds.has(user.id)) : 
      usersToFetch.filter(user => !existingUserIds.has(user.id));
    
    console.log(`${usersToProcess.length} users need CRM records created`);
    
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    // Process each user
    for (const user of usersToProcess) {
      try {
        console.log(`Processing user: ${user.id} (${user.email})`);
        
        // Call the create-crm-person function
        const { data: crmResult, error: crmCreateError } = await supabaseClient.functions.invoke(
          'create-crm-person',
          {
            body: {
              userId: user.id,
              email: user.email || '',
              firstName: user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || 'Unknown',
              lastName: user.user_metadata?.last_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || 'User',
              phone: user.user_metadata?.phone || user.phone || undefined
            }
          }
        );
        
        if (crmCreateError) {
          console.error(`Failed to create CRM person for user ${user.id}:`, crmCreateError);
          errorCount++;
          results.push({
            userId: user.id,
            email: user.email,
            status: 'error',
            error: crmCreateError.message
          });
        } else {
          console.log(`Successfully created CRM person for user ${user.id}:`, crmResult);
          successCount++;
          results.push({
            userId: user.id,
            email: user.email,
            status: 'success',
            personId: crmResult?.personId
          });
        }
        
        // Small delay to avoid overwhelming the CRM API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        errorCount++;
        results.push({
          userId: user.id,
          email: user.email,
          status: 'error',
          error: error.message
        });
      }
    }
    
    // Log the final results
    await supabaseClient
      .from('integration_logs')
      .insert({
        integration_type: 'daily_user_sync',
        status: errorCount === 0 ? 'success' : 'partial_success',
        response_data: {
          totalFound: usersToFetch.length,
          alreadyInCrm: existingUserIds.size,
          processed: usersToProcess.length,
          successful: successCount,
          errors: errorCount,
          syncType: syncAll ? 'full' : 'daily',
          results: results
        },
        error_message: errorCount > 0 ? `${errorCount} users failed to sync` : null
      });
    
    console.log(`Daily sync completed: ${successCount} successful, ${errorCount} errors`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Processed ${usersToProcess.length} users`,
        successCount,
        errorCount,
        stats: {
          totalUsers: usersToFetch.length,
          alreadyInCrm: existingUserIds.size,
          processed: usersToProcess.length,
          successful: successCount,
          errors: errorCount,
          syncType: syncAll ? 'full' : 'daily'
        },
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Daily user sync failed:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});