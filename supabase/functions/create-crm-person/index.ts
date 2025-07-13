import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreatePersonRequest {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
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
    const { userId, email, firstName, lastName, phone }: CreatePersonRequest = await req.json();
    
    console.log(`Creating CRM person for user ${userId} with email ${email}`);
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Get Twenty CRM configuration from secrets
    const twentyCrmUrl = Deno.env.get('TWENTY_CRM_BASE_URL');
    const twentyCrmApiKey = Deno.env.get('TWENTY_CRM_API_KEY');
    
    if (!twentyCrmUrl || !twentyCrmApiKey) {
      console.error('Twenty CRM configuration missing');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Twenty CRM not configured' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if person already exists in our database
    const { data: existingPerson } = await supabaseClient
      .from('crm_persons')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingPerson) {
      console.log('Person already exists:', existingPerson.crm_person_id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          personId: existingPerson.crm_person_id,
          existing: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if person exists in Twenty CRM by email
    const existingPersonResponse = await fetch(`${twentyCrmUrl}/rest/people?filter[emails][primaryEmail][eq]=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${twentyCrmApiKey}`
      }
    });

    let personId: string;

    if (existingPersonResponse.ok) {
      const existingResult = await existingPersonResponse.json();
      console.log('Existing person search result:', existingResult);
      
      if (existingResult.data?.people && existingResult.data.people.length > 0) {
        personId = existingResult.data.people[0].id;
        console.log('Found existing Twenty CRM person:', personId);
      } else {
        // Create new person in Twenty CRM
        const createPersonMutation = `
          mutation CreatePerson($data: PersonCreateInput!) {
            createPerson(data: $data) {
              id
              name {
                firstName
                lastName
              }
              emails {
                primaryEmail
              }
              phone
              createdAt
            }
          }
        `;

        const variables = {
          data: {
            name: {
              firstName: firstName || 'Unknown',
              lastName: lastName || 'User'
            },
            emails: {
              primaryEmail: email
            },
            phone: phone || null
          }
        };
        
        console.log('Creating person with variables:', JSON.stringify(variables, null, 2));
        
        const createResponse = await fetch(`${twentyCrmUrl}/graphql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${twentyCrmApiKey}`
          },
          body: JSON.stringify({
            query: createPersonMutation,
            variables: variables
          })
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error('Person creation API error:', createResponse.status, errorText);
          throw new Error(`CRM API error (${createResponse.status}): ${errorText}`);
        }

        const result = await createResponse.json();
        console.log('Person creation response:', result);
        
        personId = result.data?.createPerson?.id;
        
        if (!personId) {
          console.error('No person ID in response:', result);
          throw new Error('No person ID returned from CRM');
        }
        
        console.log('Twenty CRM person created:', personId);
      }
    } else {
      throw new Error(`Failed to search for existing person: ${existingPersonResponse.statusText}`);
    }

    // Store person mapping in our database
    const { error: insertError } = await supabaseClient
      .from('crm_persons')
      .insert({
        user_id: userId,
        crm_person_id: personId,
        email: email,
        first_name: firstName,
        last_name: lastName,
        phone: phone
      });

    if (insertError) {
      console.error('Failed to store person mapping:', insertError);
      // Don't fail the entire operation if we can't store the mapping
    }

    // Log the integration attempt
    await supabaseClient
      .from('integration_logs')
      .insert({
        integration_type: 'twenty_crm_person',
        status: 'success',
        response_data: { personId },
        error_message: null
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        personId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Create CRM person failed:', error);
    
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