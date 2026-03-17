import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_SYSTEM_PROMPT = `Você é um assistente de revisão de roteiros de vídeos curtos.

REGRAS ABSOLUTAS:
1. Faça SOMENTE a alteração solicitada pelo usuário
2. NÃO mude NADA além do que foi explicitamente pedido
3. Mantenha TODA a formatação original: quebras de linha, espaços, pontuação
4. Se a instrução for ambígua ou você não entender, peça esclarecimento na explicação
5. Retorne SEMPRE o texto COMPLETO atualizado, mesmo que tenha mudado apenas uma palavra

IMPORTANTE:
- Se o usuário pedir para trocar uma palavra, troque APENAS essa palavra
- Se o usuário pedir para adicionar algo, adicione EXATAMENTE onde pediu
- Se o usuário pedir para remover algo, remova APENAS o que foi pedido
- Nunca "melhore" ou "ajuste" nada além do solicitado`;

const DEFAULT_VARIANTES_PROMPT = `Você é um assistente de revisão de roteiros de vídeos curtos.

Você vai receber um roteiro e uma instrução de alteração sobre um trecho selecionado.
Gere EXATAMENTE 3 variações diferentes APENAS do trecho selecionado, cada uma aplicando a instrução de formas distintas.

REGRAS:
1. Aplique SOMENTE a alteração solicitada, de 3 formas criativas diferentes
2. Mantenha a formatação original: quebras de linha, espaços, pontuação
3. Cada variação deve ser diferente das outras, mas todas devem atender à instrução
4. Retorne APENAS o trecho que substitui a seleção, NÃO o texto completo
5. O trecho retornado vai substituir EXATAMENTE a parte selecionada no texto original`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { headline, estrutura, mensagem, historico = [], selecao, promptSistema, variantes = false } = await req.json();

    if (!mensagem) {
      return new Response(
        JSON.stringify({ error: "Mensagem é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não está configurada");
    }

    // Montar contexto do roteiro atual
    let roteiroContext = `
ROTEIRO ATUAL:

HEADLINE:
${headline || "(vazio)"}

ESTRUTURA:
${estrutura || "(vazio)"}
`.trim();

    // Se há seleção, adicionar instrução específica ao contexto
    if (selecao && selecao.texto) {
      roteiroContext += `

ATENÇÃO: O usuário selecionou este trecho específico do campo "${selecao.campo}":
"${selecao.texto}"

A instrução do usuário se refere APENAS a este trecho selecionado.
Altere SOMENTE esta parte, mantendo todo o resto do texto IDÊNTICO.`;
    }

    // --- MODE: 3 Variantes ---
    if (variantes) {
      const systemPrompt = promptSistema || DEFAULT_VARIANTES_PROMPT;

      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: roteiroContext },
        ...historico.map((msg: { role: string; content: string }) => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: "user", content: mensagem },
      ];

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages,
          tools: [
            {
              type: "function",
              function: {
                name: "return_variantes",
                description: "Retorna 3 variações do roteiro com a alteração solicitada",
                parameters: {
                  type: "object",
                  properties: {
                     variantes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          trecho_substituto: { type: "string", description: "O trecho que vai substituir a seleção do usuário. Retorne APENAS o trecho, não o texto completo." },
                          resumo: { type: "string", description: "Resumo curto (max 15 palavras) do que foi alterado nesta variação" },
                        },
                        required: ["trecho_substituto", "resumo"],
                        additionalProperties: false,
                      },
                      minItems: 3,
                      maxItems: 3,
                    },
                  },
                  required: ["variantes"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "return_variantes" } },
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
          JSON.stringify({ error: "Erro no gateway de IA" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

      if (!toolCall || toolCall.function.name !== "return_variantes") {
        return new Response(
          JSON.stringify({ error: "Não foi possível gerar as variações. Tente novamente." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify({ variantes: result.variantes }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- MODE: Single edit (original behavior) ---
    const systemPrompt = promptSistema || DEFAULT_SYSTEM_PROMPT;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: roteiroContext },
      ...historico.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: mensagem },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "update_roteiro",
              description: "Atualiza o roteiro com as alterações solicitadas pelo usuário",
              parameters: {
                type: "object",
                properties: {
                  headline: {
                    type: "string",
                    description: "A headline completa atualizada (ou a mesma se não foi alterada)",
                  },
                  estrutura: {
                    type: "string",
                    description: "A estrutura/roteiro completo atualizado (ou o mesmo se não foi alterado)",
                  },
                  explanation: {
                    type: "string",
                    description: "Breve explicação do que foi alterado ou pergunta de esclarecimento",
                  },
                },
                required: ["headline", "estrutura", "explanation"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "update_roteiro" } },
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
        JSON.stringify({ error: "Erro no gateway de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Extrair resultado do tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "update_roteiro") {
      // Fallback: tentar extrair do content se não veio tool call
      const content = data.choices?.[0]?.message?.content;
      return new Response(
        JSON.stringify({
          headline: headline,
          estrutura: estrutura,
          explanation: content || "Não consegui processar a solicitação. Tente reformular.",
          changed: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    // Detectar se houve mudança
    const headlineChanged = result.headline !== headline;
    const estruturaChanged = result.estrutura !== estrutura;

    return new Response(
      JSON.stringify({
        headline: result.headline,
        estrutura: result.estrutura,
        explanation: result.explanation,
        changed: headlineChanged || estruturaChanged,
        headlineChanged,
        estruturaChanged,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("revisar-roteiro error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
