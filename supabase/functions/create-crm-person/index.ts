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
    // Use service role client for system operations
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

    // Always create new person in Twenty CRM for each user
    let personId: string;

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
          phones {
            primaryPhoneNumber
          }
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
        phones: phone ? {
          primaryPhoneNumber: phone
        } : undefined
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
    console.log('Person creation response:', JSON.stringify(result, null, 2));
    
    // Check for GraphQL errors first
    if (result.errors && result.errors.length > 0) {
      console.error('GraphQL errors:', result.errors);
      
      // Check for duplicate email error specifically
      const isDuplicateEmail = result.errors.some(error => 
        error.message?.includes('Duplicate Emails') || 
        error.extensions?.code === 'BAD_USER_INPUT'
      );
      
      if (isDuplicateEmail) {
        // Try to find existing person with this email
        console.log('Person with this email already exists, attempting to find existing person');
        
        try {
          const findPersonQuery = `
            query FindPersonByEmail($email: String!) {
              people(filter: { emails: { primaryEmail: { eq: $email } } }) {
                edges {
                  node {
                    id
                    emails {
                      primaryEmail
                    }
                  }
                }
              }
            }
          `;
          
          const findResponse = await fetch(`${twentyCrmUrl}/graphql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${twentyCrmApiKey}`
            },
            body: JSON.stringify({
              query: findPersonQuery,
              variables: { email }
            })
          });
          
          if (findResponse.ok) {
            const findResult = await findResponse.json();
            const existingPerson = findResult.data?.people?.edges?.[0]?.node;
            
            if (existingPerson?.id) {
              console.log('Found existing person:', existingPerson.id);
              personId = existingPerson.id;
            }
          }
        } catch (findError) {
          console.error('Error finding existing person:', findError);
        }
        
        if (!personId) {
          throw new Error(`GraphQL error: ${result.errors[0].message}`);
        }
      } else {
        throw new Error(`GraphQL error: ${result.errors[0].message}`);
      }
    } else {
      // No errors, extract person ID from successful creation
      personId = result.data?.createPerson?.id;
    }
    
    if (!personId) {
      console.error('No person ID in response. Full response:', JSON.stringify(result, null, 2));
      console.error('Expected path: result.data.createPerson.id');
      console.error('Actual data structure:', result.data);
      
      // Try alternative response structures
      if (result.data?.person?.id) {
        personId = result.data.person.id;
        console.log('Found person ID in alternative structure:', personId);
      } else if (result.id) {
        personId = result.id;
        console.log('Found person ID in root:', personId);
      } else {
        // Log detailed error for debugging
        await supabaseClient
          .from('integration_logs')
          .insert({
            integration_type: 'twenty_crm_person',
            status: 'error',
            response_data: { 
              fullResponse: result,
              expectedPath: 'result.data.createPerson.id',
              actualData: result.data,
              error: 'No person ID found in any expected location'
            },
            error_message: 'Twenty CRM API returned unexpected response structure'
          });
        
        throw new Error('No person ID returned from CRM - check integration logs for details');
      }
    }
    
    console.log('Twenty CRM person created:', personId);

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
      
      // If it's a duplicate key error, check which constraint was violated
      if (insertError.code === '23505') {
        if (insertError.message.includes('crm_persons_user_id_key')) {
          // User already has a CRM person - this is fine, return existing
          console.log('User already has CRM person mapping');
          const { data: existingMapping } = await supabaseClient
            .from('crm_persons')
            .select('crm_person_id')
            .eq('user_id', userId)
            .single();
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              personId: existingMapping?.crm_person_id || personId,
              existing: true 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // Log the error but don't fail - CRM person was created successfully
          console.error('Database mapping failed but CRM person exists:', insertError);
          await supabaseClient
            .from('integration_logs')
            .insert({
              integration_type: 'twenty_crm_person',
              status: 'partial_success',
              response_data: { personId, error: insertError.message },
              error_message: `Database mapping failed: ${insertError.message}`
            });
        }
      } else {
        // For other errors, we should still log but not fail
        await supabaseClient
          .from('integration_logs')
          .insert({
            integration_type: 'twenty_crm_person',
            status: 'partial_success',
            response_data: { personId, error: insertError.message },
            error_message: `Database mapping failed: ${insertError.message}`
          });
      }
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
    
    // Log the error to integration logs for debugging
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabaseClient
        .from('integration_logs')
        .insert({
          integration_type: 'twenty_crm_person',
          status: 'error',
          response_data: { error: error.message, stack: error.stack },
          error_message: `Edge function error: ${error.message}`
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
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