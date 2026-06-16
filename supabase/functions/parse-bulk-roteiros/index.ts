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
    const { texto } = await req.json() as { texto: string };

    if (!texto || typeof texto !== "string" || texto.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Texto vazio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const systemPrompt = `Você é um especialista em organizar conteúdo de roteiros e headlines.

Sua tarefa: receber um texto livre colado pelo usuário (pode conter várias headlines, ou várias headlines + roteiros/estruturas) e separar em itens individuais.

REGRAS:
- Cada item tem uma "headline" (obrigatória) e uma "estrutura" (opcional, pode ser string vazia).
- A headline é o título/gancho curto (geralmente 1 linha curta, com força de chamada).
- A estrutura é o roteiro/desenvolvimento que vem depois da headline (pode ter múltiplas linhas/parágrafos).
- Se o texto tiver SÓ headlines (1 por linha, ou separadas por linhas em branco), retorne cada uma como item com estrutura vazia.
- Se o texto tiver headlines + roteiros, agrupe cada headline com o roteiro que vem logo abaixo dela.
- Detecte automaticamente o formato: numeração (1., 2., -, •), separadores (---, ===, linha em branco dupla), rótulos ("Headline:", "Roteiro:", "Estrutura:"), etc.
- Remova rótulos como "Headline:", "Título:", "Roteiro:", "Estrutura:", "Hook:" do conteúdo final.
- Remova numeração inicial (ex: "1. ", "01) ", "- ") da headline.
- NÃO invente conteúdo. Se uma estrutura não existir, deixe vazia.
- Preserve o texto original (não reescreva, não corrija, não resuma).

Responda APENAS com JSON válido, sem markdown, no formato:
{
  "items": [
    { "headline": "string", "estrutura": "string" }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Texto colado pelo usuário:\n\n${texto}` },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro Lovable AI:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`API retornou ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed: { items: Array<{ headline: string; estrutura: string }> };
    try {
      parsed = JSON.parse(cleanContent);
    } catch (e) {
      console.error("Erro parseando JSON da IA:", cleanContent);
      throw new Error("IA retornou formato inválido");
    }

    const items = (parsed.items || [])
      .map((it) => ({
        headline: String(it.headline || "").trim(),
        estrutura: String(it.estrutura || "").trim(),
      }))
      .filter((it) => it.headline.length > 0);

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro parse-bulk-roteiros:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});