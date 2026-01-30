

## Plano: Verificacao Inteligente com IA + Novo Layout do Check Viral

### Resumo das Mudancas

O usuario identificou dois problemas:
1. A descricao do check deveria ser usada por uma IA para verificar dinamicamente o roteiro, em vez de regras fixas
2. O painel de checks ao lado do roteiro esta deformando o layout e ficando visualmente ruim

---

### Problema 1: Verificacao Inteligente Baseada na Descricao

**Situacao Atual:**
- A `descricao` e apenas um texto informativo exibido como tooltip
- A verificacao usa regras fixas: `contem`, `nao_contem`, `regex`, `mentorado_nome`
- Exemplo: "nome do mentorado errado" usa regra fixa que busca primeiro nome

**Solucao Proposta:**
Adicionar um novo tipo de regra chamado `ia` (ou `inteligente`) que usa a descricao do check para que a IA analise o roteiro e determine se o criterio esta sendo cumprido.

#### Fluxo da Verificacao Inteligente:

1. Admin cadastra o check com:
   - Nome: "Nome do mentorado errado"
   - Tipo de regra: **Inteligente (IA)**
   - Descricao: "ela vai verificar o nome do mentorado cadastrado e vai conferir se durante o roteiro, foi mencionado o nome de forma correta"

2. Quando o usuario edita um roteiro, os checks com `regra_tipo = "ia"` sao verificados chamando uma edge function que:
   - Recebe: headline, estrutura, nome do mentorado, e a descricao do check
   - A IA analisa se o criterio da descricao esta sendo cumprido
   - Retorna: `{ passa: boolean, motivo?: string }`

#### Arquivos a Modificar:

| Arquivo | Mudancas |
|---------|----------|
| `src/hooks/useCheckRoteiroViral.ts` | Adicionar tipo "ia" e funcao de verificacao assincrona |
| `src/components/mentorados/CheckRoteiroViralDialog.tsx` | Adicionar opcao "Inteligente (IA)" no seletor de tipo de regra |
| `supabase/functions/verificar-check-viral/index.ts` | **NOVA** - Edge function que usa IA para verificar o check |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Adicionar logica de verificacao assincrona para checks tipo IA |

#### Nova Edge Function: verificar-check-viral

```typescript
// Recebe: headline, estrutura, mentoradoNome, descricaoCheck
// Usa IA para determinar se o roteiro atende ao criterio descrito
// Retorna: { passa: boolean, motivo?: string }

const prompt = `
Voce e um verificador de roteiros virais.

MENTORADO: ${mentoradoNome}
HEADLINE: ${headline}
ESTRUTURA: ${estrutura}

CRITERIO A VERIFICAR:
"${descricaoCheck}"

Analise se o roteiro ATENDE ao criterio descrito acima.
Responda com JSON: { "passa": true/false, "motivo": "explicacao curta" }
`;
```

---

### Problema 2: Layout do Painel de Checks

**Situacao Atual:**
- O `CheckRoteiroViralPanel` aparece ao lado de cada roteiro com `flex gap-4`
- Isso comprime o conteudo do roteiro e deforma o texto
- Layout visualmente ruim, especialmente com varios checks

**Solucao Proposta:**
Mover os checks para dentro da area do roteiro, abaixo da contagem de caracteres, de forma compacta e inline. Usar badges/chips em vez de um painel lateral.

#### Novo Layout:

```text
+--------------------------------------------------+
| HEADLINE 01:                                      |
| Os vicios nao suportam esses dois versiculos...   |
+--------------------------------------------------+
| ESTRUTURA 01:                                     |
| Os vicios nao suportam esses dois versiculos...   |
|                                                   |
| Voce ja sentiu que uma forca invisivel te protege |
| na hora da tentacao? E isso que esses versiculos  |
| fazem quando sao repetidos mentalmente com fe.    |
|                                                   |
|                                   1139 caracteres |
+--------------------------------------------------+
| [!] Nome do mentorado errado  [!] Faltou CTA     | <-- chips/badges
+--------------------------------------------------+
```

#### Caracteristicas do Novo Layout:

- **Badges/Chips compactos** em vez de painel lateral
- **Inline abaixo do roteiro** - nao afeta a largura do texto
- **Cor de alerta** (vermelho/amarelo) para indicar problema
- **Tooltip** com descricao do check ao passar o mouse
- **Clicavel** - futuramente pode abrir sugestao de correcao

#### Arquivos a Modificar:

| Arquivo | Mudancas |
|---------|----------|
| `src/components/mentorados/CheckRoteiroViralPanel.tsx` | Transformar em layout horizontal de badges |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Mover o painel para dentro do bloco do roteiro (abaixo do contador de caracteres) |

---

### Detalhes Tecnicos

#### 1. Novo Tipo de Regra no Dialog

Adicionar ao `REGRA_TIPOS`:
```typescript
const REGRA_TIPOS = [
  { value: "contem", label: "Contem (palavras separadas por virgula)" },
  { value: "nao_contem", label: "Nao contem" },
  { value: "regex", label: "Expressao regular" },
  { value: "mentorado_nome", label: "Nome do mentorado" },
  { value: "ia", label: "Inteligente (IA)" },  // NOVO
];
```

Quando o tipo for "ia", a descricao passa a ser **obrigatoria** e e ela que define o que a IA deve verificar.

#### 2. Verificacao Assincrona para Checks IA

Como a verificacao com IA e assincrona, precisamos:

1. Verificar checks de regras fixas imediatamente (como hoje)
2. Para checks tipo "ia", disparar verificacao em background
3. Armazenar resultado em estado local
4. Usar debounce para nao chamar a cada tecla

```typescript
// Estado para armazenar resultados de checks IA
const [iaCheckResults, setIaCheckResults] = useState<Map<string, boolean>>(new Map());

// Debounce de 2 segundos apos parar de digitar
useEffect(() => {
  const checksIA = checksVirais.filter(c => c.regra_tipo === "ia");
  if (checksIA.length === 0) return;
  
  const timer = setTimeout(() => {
    checksIA.forEach(check => {
      verificarCheckComIA(check, headline, estrutura, mentoradoNome)
        .then(passa => {
          setIaCheckResults(prev => new Map(prev).set(check.id, passa));
        });
    });
  }, 2000);
  
  return () => clearTimeout(timer);
}, [headline, estrutura, checksVirais]);
```

#### 3. Novo Layout do CheckRoteiroViralPanel

```tsx
export const CheckRoteiroViralPanel = ({ checks, className }: Props) => {
  if (checks.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2 mt-2", className)}>
      {checks.map((check) => (
        <div
          key={check.id}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20"
          title={check.descricao || undefined}
        >
          <AlertCircle className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{check.nome}</span>
        </div>
      ))}
    </div>
  );
};
```

#### 4. Integracao no MentoradoRoteirosView

Mover o painel para DENTRO do bloco do roteiro, abaixo do contador de caracteres:

```tsx
{/* Estrutura */}
<div className="mb-4">
  <span className="font-poppins font-bold text-[#B8860B] text-base">
    ESTRUTURA {String(ordem).padStart(2, "0")}:
  </span>
  <InlineSpellCheckEditor ... />
  <div className="text-right text-xs text-muted-foreground mt-1">
    {roteiro.estrutura?.length || 0} caracteres
  </div>
  
  {/* Checks que falharam - AGORA AQUI DENTRO */}
  {checksQueFalharam.length > 0 && (
    <CheckRoteiroViralPanel checks={checksQueFalharam} />
  )}
</div>

{/* Remover o painel do flex lateral */}
```

---

### Edge Function: verificar-check-viral

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // ... cors headers ...
  
  const { headline, estrutura, mentoradoNome, descricaoCheck, checkNome } = await req.json();
  
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite", // Modelo rapido e barato
      messages: [
        {
          role: "system",
          content: `Voce verifica se roteiros de video atendem a criterios especificos.
Responda APENAS com JSON: { "passa": true/false, "motivo": "explicacao curta" }
Seja rigoroso e objetivo.`
        },
        {
          role: "user",
          content: `MENTORADO: ${mentoradoNome}

HEADLINE:
${headline || "(vazio)"}

ESTRUTURA:
${estrutura || "(vazio)"}

VERIFICAR SE ATENDE AO CRITERIO:
"${descricaoCheck}"

O roteiro atende a este criterio?`
        }
      ],
      response_format: { type: "json_object" }
    }),
  });
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  try {
    const result = JSON.parse(content);
    return new Response(JSON.stringify(result), { headers: corsHeaders });
  } catch {
    return new Response(JSON.stringify({ passa: true, motivo: "Erro ao processar" }), { headers: corsHeaders });
  }
});
```

---

### Resumo dos Arquivos

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `supabase/functions/verificar-check-viral/index.ts` | CRIAR | Edge function que verifica check usando IA |
| `src/hooks/useCheckRoteiroViral.ts` | MODIFICAR | Adicionar funcao de verificacao assincrona |
| `src/components/mentorados/CheckRoteiroViralDialog.tsx` | MODIFICAR | Adicionar tipo "Inteligente (IA)" |
| `src/components/mentorados/CheckRoteiroViralPanel.tsx` | MODIFICAR | Transformar em badges horizontais |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | MODIFICAR | Reposicionar painel e adicionar logica para checks IA |

---

### Consideracoes

- Checks tipo "ia" tem custo de API (Gemini Flash Lite e barato mas nao e gratis)
- Debounce de 2s evita chamadas excessivas
- Checks de regras fixas continuam funcionando instantaneamente
- O novo layout horizontal de badges nao afeta a largura do texto
- Tooltip mostra a descricao completa do check
- Futuramente: clicar no badge pode abrir sugestao de correcao

