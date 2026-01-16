import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_RETRIES = 2;
const BATCH_SIZE = 15; // Process in smaller batches to avoid timeouts

async function generateBatch(
  headlines: string[],
  inteligencia: string,
  apiKey: string
): Promise<{ original: string; adaptada: string }[]> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash", // Using faster, more reliable model
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

  const data = await response.json();
  
  // Check for error in response body (API can return error in body even with 200 status)
  if (data.error) {
    console.error("AI API error in response body:", data.error);
    throw new Error(data.error.message || "Erro na API de IA");
  }

  if (!response.ok) {
    console.error("AI gateway HTTP error:", response.status, data);
    throw new Error(`HTTP ${response.status}: ${data.message || "Erro ao gerar headlines"}`);
  }

  // Extract the tool call result
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.function.name !== "return_adapted_headlines") {
    console.error("Unexpected response format:", JSON.stringify(data).substring(0, 500));
    throw new Error("Formato de resposta inesperado");
  }

  const result = JSON.parse(toolCall.function.arguments);
  return result.headlines || [];
}

async function generateWithRetry(
  headlines: string[],
  inteligencia: string,
  apiKey: string
): Promise<{ original: string; adaptada: string }[]> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt}/${MAX_RETRIES}...`);
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
      
      return await generateBatch(headlines, inteligencia, apiKey);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt + 1} failed:`, lastError.message);
      
      // Don't retry on certain errors
      if (lastError.message.includes("402") || lastError.message.includes("Créditos")) {
        throw lastError;
      }
    }
  }
  
  throw lastError || new Error("Falha ao gerar headlines após várias tentativas");
}

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

    // Process in batches to avoid timeouts
    const allResults: { original: string; adaptada: string }[] = [];
    
    for (let i = 0; i < headlines.length; i += BATCH_SIZE) {
      const batch = headlines.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(headlines.length / BATCH_SIZE)} (${batch.length} headlines)`);
      
      try {
        const batchResults = await generateWithRetry(batch, inteligencia, LOVABLE_API_KEY);
        allResults.push(...batchResults);
      } catch (error) {
        console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error);
        
        // If we have some results, return them with a warning
        if (allResults.length > 0) {
          console.log(`Returning partial results: ${allResults.length} headlines`);
          return new Response(
            JSON.stringify({ 
              headlines: allResults,
              partial: true,
              message: `Gerado ${allResults.length} de ${headlines.length} headlines. Algumas falharam.`
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        throw error;
      }
    }

    console.log(`Successfully generated ${allResults.length} adapted headlines`);

    return new Response(
      JSON.stringify({ headlines: allResults }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-headlines:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    
    // Return appropriate status codes
    if (errorMessage.includes("402") || errorMessage.includes("Créditos")) {
      return new Response(
        JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (errorMessage.includes("429") || errorMessage.includes("Limite")) {
      return new Response(
        JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
