import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HeadlineInput {
  key: string;
  headline: string;
}

interface MentoradoInput {
  nome: string;
  informacoes_mentorado: string | null;
  apresentacao: string | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mentorado, headlines } = await req.json() as {
      mentorado: MentoradoInput;
      headlines: HeadlineInput[];
    };

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const systemPrompt = `Você é um especialista em criação de conteúdo viral para redes sociais.

Sua tarefa é extrair "insumos" - ideias, fatos pouco conhecidos, referências de livros/estudos que podem tornar o roteiro mais interessante e único.

Para cada headline fornecida, sugira 3-5 insumos numerados:
1: [ideia/fato/referência]
2: [ideia/fato/referência]
3: [ideia/fato/referência]

Foque em:
- O nicho/contexto do mentorado
- Fatos surpreendentes ou contra-intuitivos
- Referências de livros, estudos ou especialistas
- Dados estatísticos interessantes
- Histórias ou exemplos memoráveis

IMPORTANTE: Responda APENAS em formato JSON válido, sem markdown ou texto adicional.`;

    const userPrompt = `Mentorado: ${mentorado.nome}
Contexto: ${mentorado.informacoes_mentorado || "Não especificado"}
Apresentação: ${mentorado.apresentacao || "Não especificada"}

Headlines para gerar insumos:
${headlines.map((h, i) => `${i + 1}. [key: ${h.key}] ${h.headline}`).join("\n")}

Responda em JSON com o formato:
{
  "insumos": [
    { "key": "1-1", "insumo": "1: ideia X\\n2: fato Y\\n3: referência Z" }
  ]
}`;

    console.log("Enviando para Lovable AI...");

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro na API Lovable:", errorText);
      throw new Error(`API Lovable retornou erro: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("Resposta da IA:", JSON.stringify(aiResponse, null, 2));

    const content = aiResponse.choices?.[0]?.message?.content || "";
    
    // Tentar parsear o JSON da resposta
    let parsedInsumos;
    try {
      // Remover possíveis blocos de código markdown
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsedInsumos = JSON.parse(cleanContent);
    } catch (parseErr) {
      console.error("Erro ao parsear resposta:", parseErr);
      console.log("Conteúdo recebido:", content);
      
      // Fallback: criar insumos vazios para cada headline
      parsedInsumos = {
        insumos: headlines.map(h => ({
          key: h.key,
          insumo: "1: (Gere manualmente)\n2: (Gere manualmente)\n3: (Gere manualmente)",
        })),
      };
    }

    return new Response(JSON.stringify(parsedInsumos), {
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
