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

    // Guardar os keys do payload original para mapear de volta
    const originalKeys = payload.roteiros?.map((r: { key: string }) => r.key) || [];

    console.log("Enviando para n8n:", JSON.stringify(payload, null, 2));
    console.log("Keys originais:", originalKeys);

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

    // Transformar resposta do n8n para o formato esperado pelo frontend
    let transformedData;

    if (Array.isArray(data)) {
      // N8n retorna array de { output: string }
      transformedData = {
        roteiros: data.map((item: { output?: string }, index: number) => ({
          key: originalKeys[index] || `unknown-${index}`,
          estrutura: item.output || "",
        })),
      };
      console.log("Resposta transformada de array:", JSON.stringify(transformedData, null, 2));
    } else if (data.roteiros) {
      // Já está no formato correto
      transformedData = data;
      console.log("Resposta já no formato correto");
    } else if (data.raw_response || data.message) {
      // Resposta não estruturada ou vazia
      transformedData = data;
    } else {
      // Formato desconhecido - tentar extrair output se existir
      transformedData = { roteiros: [] };
      console.log("Formato desconhecido, retornando vazio");
    }

    return new Response(JSON.stringify(transformedData), {
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
