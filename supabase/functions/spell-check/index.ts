import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, language = "pt-BR" } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Skip very short texts
    if (text.trim().length < 10) {
      return new Response(
        JSON.stringify({ errors: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Você é um corretor ortográfico e gramatical especializado em português brasileiro.

Analise o texto fornecido e retorne APENAS erros ortográficos e gramaticais reais.

NÃO reporte:
- Espaços duplos (já tratado localmente)
- Espaços antes de pontuação (já tratado localmente)
- Falta de espaço após pontuação (já tratado localmente)
- Palavras duplicadas consecutivas (já tratado localmente)
- Espaços no início/fim (já tratado localmente)
- Múltiplas quebras de linha (já tratado localmente)
- Gírias ou expressões coloquiais intencionais
- Abreviações comuns (vc, tb, pq, etc.)
- Emojis ou símbolos
- Nomes próprios

APENAS reporte:
- Erros ortográficos reais (palavras escritas incorretamente)
- Erros gramaticais claros (concordância, regência)
- Acentuação incorreta

Responda APENAS com um JSON válido no formato:
{
  "errors": [
    {
      "type": "spelling" | "grammar",
      "original": "palavra ou trecho errado",
      "suggestion": "correção sugerida",
      "position": número_aproximado_da_posição,
      "message": "descrição curta do erro"
    }
  ]
}

Se não houver erros, retorne: { "errors": [] }`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analise este texto em ${language}:\n\n${text}` },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later.", errors: [] }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits.", errors: [] }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ errors: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Try to parse JSON from the response
    let errors = [];
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        errors = parsed.errors || [];
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.log("Raw content:", content);
    }

    return new Response(
      JSON.stringify({ errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("spell-check error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", errors: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
