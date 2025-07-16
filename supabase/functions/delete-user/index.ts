import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

interface DeleteUserRequest {
  userId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    // Verify the request is from an authenticated admin user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify the user making the request using the anon client
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

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

    // Check if the authenticated user is an admin by checking their role
    const userRole = user.user_metadata?.role || 'user'
    
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

    console.log('Admin user authenticated:', user.email)

    // Parse the request body
    const { userId }: DeleteUserRequest = await req.json()

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

    console.log('Attempting to delete user with ID:', userId)

    // Prevent deletion of admin users
    const { data: targetUser, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (fetchError) {
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
    if (targetUserRole === 'admin') {
      return new Response(
        JSON.stringify({ error: 'Cannot delete admin users' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Delete the user - first clean up related data to avoid foreign key constraints
    console.log('Starting user deletion process for:', userId)

    // First, delete from user_profiles table to avoid foreign key constraint violations
    const { error: profileDeleteError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    if (profileDeleteError) {
      console.error('Error deleting user profile:', profileDeleteError)
      // Continue anyway - profile might not exist
    } else {
      console.log('Successfully deleted user profile')
    }

    // Delete any user_company_relationships
    const { error: relationshipsError } = await supabaseAdmin
      .from('user_company_relationships')
      .delete()
      .eq('user_id', userId)

    if (relationshipsError) {
      console.error('Error deleting user relationships:', relationshipsError)
      // Continue anyway
    } else {
      console.log('Successfully deleted user relationships')
    }

    // Delete any user_engagement_events
    const { error: engagementError } = await supabaseAdmin
      .from('user_engagement_events')
      .delete()
      .eq('user_id', userId)

    if (engagementError) {
      console.error('Error deleting user engagement events:', engagementError)
      // Continue anyway
    } else {
      console.log('Successfully deleted user engagement events')
    }

    // Update any submissions to remove user_id reference
    const { error: submissionUpdateError } = await supabaseAdmin
      .from('submissions')
      .update({ user_id: null })
      .eq('user_id', userId)

    if (submissionUpdateError) {
      console.error('Error updating submissions:', submissionUpdateError)
      // Continue anyway
    } else {
      console.log('Successfully updated submissions to remove user reference')
    }

    // Finally, delete the user from auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in delete-user function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})