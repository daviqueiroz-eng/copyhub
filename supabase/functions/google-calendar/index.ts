import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-provider-token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obter token do usuário autenticado
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Tentar obter providerToken do body ou header
    let body: any = {};
    try {
      body = await req.json();
    } catch (_) {
      body = {};
    }

    const { method, eventData, providerToken: bodyProviderToken } = body || {};
    const headerProviderToken = req.headers.get('x-provider-token') || undefined;

    let providerToken = bodyProviderToken || headerProviderToken;

    // Fallback para lookup admin (pode não existir em alguns casos)
    if (!providerToken) {
      const { data: sessionData } = await supabase.auth.admin.getUserById(user.id);
      providerToken = (sessionData as any)?.user?.identities?.[0]?.identity_data?.provider_token;
    }

    if (!providerToken) {
      throw new Error('Missing Google provider access token. Please login again with Google and grant Calendar permissions.');
    }

    let response: Response;
    
    // GET - Listar eventos
    if (method === 'GET') {
      const timeMin = new Date().toISOString();
      response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100&orderBy=startTime&singleEvents=true&timeMin=${timeMin}`,
        {
          headers: {
            'Authorization': `Bearer ${providerToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // POST - Criar evento
    else if (method === 'POST') {
      response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${providerToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        }
      );
    }
    
    // PATCH - Atualizar evento
    else if (method === 'PATCH' && eventData?.id) {
      const { id, ...updateData } = eventData;
      response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${providerToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );
    }
    
    // DELETE - Deletar evento
    else if (method === 'DELETE' && eventData?.eventId) {
      response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventData.eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${providerToken}`,
          },
        }
      );
    } else {
      throw new Error('Invalid method or missing parameters');
    }

    const data = response.status === 204 ? { success: true } : await response.json();
    
    if (!response.ok) {
      console.error('Google Calendar API error:', data);
      throw new Error(data.error?.message || 'Google Calendar API error');
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in google-calendar function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
