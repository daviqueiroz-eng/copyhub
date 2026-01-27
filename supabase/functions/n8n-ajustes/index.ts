import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    
    console.log("n8n-ajustes: Received payload:", JSON.stringify(payload));

    // Forward to n8n webhook
    const n8nResponse = await fetch(
      "https://madarawin.app.n8n.cloud/webhook-test/agente-ia-lovable-ajustes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error("n8n-ajustes: n8n error:", n8nResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar ajustes no n8n" }),
        { 
          status: n8nResponse.status, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const n8nData = await n8nResponse.json();
    console.log("n8n-ajustes: n8n response:", JSON.stringify(n8nData));

    // Return the response from n8n
    return new Response(
      JSON.stringify(n8nData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("n8n-ajustes error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
