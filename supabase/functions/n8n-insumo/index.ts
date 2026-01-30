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

    console.log("Enviando para n8n insumo:", JSON.stringify(payload, null, 2));

    // Enviar para n8n webhook de insumos (produção)
    const n8nResponse = await fetch(
      "https://madarawin.app.n8n.cloud/webhook/agente-ia-lovable-insumo",
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
        // Se não for JSON válido, usar o texto como insumo
        data = { insumo: responseText };
      }
    } else {
      // Resposta vazia do n8n
      data = { insumo: "" };
    }

    // Transformar resposta para formato esperado
    let transformedData;

    if (typeof data === "string") {
      // n8n retornou string direta
      transformedData = {
        key: payload.headline?.key || "unknown",
        insumo: data,
      };
    } else if (data.insumo) {
      // Já está no formato correto
      transformedData = {
        key: payload.headline?.key || "unknown",
        insumo: data.insumo,
      };
    } else if (data.output) {
      // Formato alternativo do n8n
      transformedData = {
        key: payload.headline?.key || "unknown",
        insumo: data.output,
      };
    } else if (Array.isArray(data) && data.length > 0) {
      // n8n retornou array
      const firstItem = data[0];
      transformedData = {
        key: payload.headline?.key || "unknown",
        insumo: firstItem.insumo || firstItem.output || JSON.stringify(firstItem),
      };
    } else {
      // Formato desconhecido - tentar extrair algo útil
      transformedData = {
        key: payload.headline?.key || "unknown",
        insumo: JSON.stringify(data),
      };
    }

    console.log("Resposta transformada:", JSON.stringify(transformedData, null, 2));

    return new Response(JSON.stringify(transformedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Erro na Edge Function n8n-insumo:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
