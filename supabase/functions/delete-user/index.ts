import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface DeleteUserRequest {
  userId: string;
}

Deno.serve(async (req) => {
  console.log('=== DELETE USER FUNCTION STARTED ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Creating Supabase admin client...')
    
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Checking authorization header...')
    
    // Verify the request is from an authenticated admin user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Missing authorization header')
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Creating anon client for auth verification...')
    
    // Verify the user making the request using the anon client
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    console.log('Verifying user token...')
    
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      console.error('Authentication error:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('User authenticated:', user.email)
    
    // Check if the authenticated user is an admin by checking their role
    const userRole = user.user_metadata?.role || 'user'
    console.log('User role:', userRole)
    
    if (userRole !== 'admin') {
      console.error('Non-admin user attempted deletion:', user.email)
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Admin verified, parsing request body...')

    // Parse the request body
    let requestBody;
    try {
      requestBody = await req.json()
      console.log('Request body parsed:', requestBody)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    const { userId }: DeleteUserRequest = requestBody

    if (!userId) {
      console.error('Missing userId in request')
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Starting deletion process for userId:', userId)

    // Get target user info first to verify it exists and check role
    console.log('Fetching target user info...')
    const { data: targetUser, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (fetchError) {
      console.error('Error fetching target user:', fetchError)
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if target user is admin
    const targetUserRole = targetUser.user?.user_metadata?.role || 'user'
    console.log('Target user role:', targetUserRole)
    
    if (targetUserRole === 'admin') {
      console.error('Attempted to delete admin user')
      return new Response(
        JSON.stringify({ error: 'Cannot delete admin users' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Starting cleanup of related data...')
    
    // Clean up related data first to avoid foreign key constraints
    try {
      // Delete user profile
      console.log('Deleting user profile...')
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('id', userId)
      
      if (profileError) {
        console.log('Profile delete error (may not exist):', profileError)
      } else {
        console.log('User profile deleted successfully')
      }

      // Delete user company relationships
      console.log('Deleting user company relationships...')
      const { error: relationshipsError } = await supabaseAdmin
        .from('user_company_relationships')
        .delete()
        .eq('user_id', userId)
      
      if (relationshipsError) {
        console.log('Relationships delete error (may not exist):', relationshipsError)
      } else {
        console.log('User relationships deleted successfully')
      }

      // Update submissions to remove user reference
      console.log('Updating submissions to remove user reference...')
      const { error: submissionUpdateError } = await supabaseAdmin
        .from('submissions')
        .update({ user_id: null })
        .eq('user_id', userId)

      if (submissionUpdateError) {
        console.log('Submissions update error:', submissionUpdateError)
      } else {
        console.log('Submissions updated successfully')
      }

    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError)
      // Continue with user deletion anyway
    }

    // Finally, delete the user from auth
    console.log('Deleting user from auth system...')
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user from auth:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user: ' + deleteError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('User deleted successfully!')
    
    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('=== FUNCTION ERROR ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('=== END ERROR ===')
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})