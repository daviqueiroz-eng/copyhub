import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    console.log("Enviando para n8n:", JSON.stringify(payload, null, 2));

    // Enviar para n8n
    const n8nResponse = await fetch(
      "https://madarawin.app.n8n.cloud/webhook-test/agente-ia-lovable-roteiros",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    // Ler resposta como texto primeiro
    const responseText = await n8nResponse.text();
    console.log("Resposta do n8n (status):", n8nResponse.status);
    console.log("Resposta do n8n (texto):", responseText);

    // Tentar parsear como JSON, se não for vazio
    let data;
    if (responseText && responseText.trim()) {
      try {
        data = JSON.parse(responseText);
      } catch {
        // Se não for JSON válido, retornar como texto
        data = { raw_response: responseText };
      }
    } else {
      // Resposta vazia do n8n
      data = { message: "Webhook processado, aguardando resposta do n8n", roteiros: [] };
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Erro na Edge Function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
