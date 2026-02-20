import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { headline, tipos } = await req.json();

    if (!headline || !tipos || tipos.length === 0) {
      return new Response(
        JSON.stringify({ tipo_id: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the types description for the prompt
    const tiposDescricao = tipos.map((t: any) => {
      let desc = `- ID: "${t.id}" | Nome: "${t.nome}"`;
      if (t.palavras_chave) desc += ` | Palavras-chave: ${t.palavras_chave}`;
      if (t.instrucoes_deteccao) desc += ` | Instrução: ${t.instrucoes_deteccao}`;
      if (t.descricao) desc += ` | Descrição: ${t.descricao}`;
      return desc;
    }).join("\n");

    const systemPrompt = `Você é um classificador de headlines de vídeo. Com base na headline fornecida e nas descrições dos tipos disponíveis, identifique o tipo mais adequado. Use as palavras-chave e instruções de detecção para tomar sua decisão. Se nenhum tipo for claramente adequado, retorne null.

Tipos disponíveis:
${tiposDescricao}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Headline: "${headline}"` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classificar_headline",
              description: "Classifica uma headline em um dos tipos disponíveis",
              parameters: {
                type: "object",
                properties: {
                  tipo_id: {
                    type: "string",
                    description: "O ID do tipo detectado, ou 'null' se nenhum tipo for adequado",
                  },
                },
                required: ["tipo_id"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classificar_headline" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded", tipo_id: null }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required", tipo_id: null }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ tipo_id: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Extract from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        const tipoId = args.tipo_id === "null" || !args.tipo_id ? null : args.tipo_id;
        
        // Validate that the tipo_id exists in the provided tipos
        if (tipoId && tipos.some((t: any) => t.id === tipoId)) {
          return new Response(
            JSON.stringify({ tipo_id: tipoId }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch {
        // Parse error
      }
    }

    return new Response(
      JSON.stringify({ tipo_id: null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("detectar-tipo-roteiro error:", e);
    return new Response(
      JSON.stringify({ tipo_id: null, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
