import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { headline, estrutura, mentoradoNome, descricaoCheck, checkNome } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `Você é um verificador rigoroso de roteiros de vídeo virais.
Sua tarefa é analisar se um roteiro atende a um critério específico.

REGRAS:
- Seja objetivo e rigoroso
- Analise o texto completo (headline + estrutura)
- Retorne APENAS JSON válido: { "passa": true/false, "motivo": "explicação curta de até 15 palavras" }
- Se o critério não puder ser verificado ou estiver ambíguo, retorne passa: true`,
          },
          {
            role: "user",
            content: `NOME DO MENTORADO: ${mentoradoNome || "(não informado)"}

HEADLINE:
${headline || "(vazio)"}

ESTRUTURA:
${estrutura || "(vazio)"}

---

CRITÉRIO A VERIFICAR (${checkNome || "check"}):
"${descricaoCheck}"

---

O roteiro ATENDE a este critério? Responda com JSON.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ passa: true, motivo: "Rate limit - tente novamente" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ passa: true, motivo: "Créditos esgotados" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ passa: true, motivo: "Erro na verificação" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ passa: true, motivo: "Resposta vazia da IA" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Tentar extrair JSON da resposta
    try {
      // Limpar a resposta caso venha com markdown
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      const result = JSON.parse(cleanContent);
      
      return new Response(
        JSON.stringify({
          passa: Boolean(result.passa),
          motivo: result.motivo || undefined,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (parseError) {
      console.error("Erro ao parsear resposta:", content);
      // Se não conseguir parsear, considerar que passa
      return new Response(
        JSON.stringify({ passa: true, motivo: "Erro ao processar resposta" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Erro na função:", error);
    return new Response(
      JSON.stringify({ passa: true, motivo: "Erro interno" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
