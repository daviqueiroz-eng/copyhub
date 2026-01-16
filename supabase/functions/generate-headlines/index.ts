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
    const { inteligencia, headlines } = await req.json();

    if (!inteligencia || !headlines || !Array.isArray(headlines) || headlines.length === 0) {
      return new Response(
        JSON.stringify({ error: "Inteligência e headlines são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "API key não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating headlines for ${headlines.length} headlines with context: ${inteligencia.substring(0, 100)}...`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em copywriting e headlines virais para redes sociais.
Sua tarefa é adaptar headlines genéricas para um nicho/contexto específico, mantendo a estrutura e gatilhos mentais da headline original.

Regras:
1. Mantenha o mesmo padrão/estrutura da headline original
2. Adapte o conteúdo para o nicho informado
3. Preserve os gatilhos mentais (curiosidade, urgência, prova social, etc.)
4. A headline adaptada deve ter tamanho similar à original
5. Use linguagem natural e persuasiva para o público-alvo`
          },
          {
            role: "user",
            content: `Contexto/Inteligência do nicho:
${inteligencia}

Headlines originais para adaptar:
${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}

Adapte cada headline para o contexto informado, mantendo a estrutura/gatilho original.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_adapted_headlines",
              description: "Retorna as headlines originais com suas versões adaptadas",
              parameters: {
                type: "object",
                properties: {
                  headlines: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        original: { type: "string", description: "A headline original" },
                        adaptada: { type: "string", description: "A headline adaptada para o nicho" }
                      },
                      required: ["original", "adaptada"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["headlines"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "return_adapted_headlines" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar headlines" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI response received:", JSON.stringify(data).substring(0, 500));

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "return_adapted_headlines") {
      console.error("Unexpected response format:", data);
      return new Response(
        JSON.stringify({ error: "Formato de resposta inesperado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log(`Successfully generated ${result.headlines?.length || 0} adapted headlines`);

    return new Response(
      JSON.stringify({ headlines: result.headlines }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-headlines:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
