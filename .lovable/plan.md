

## Plano: Fluxo em Duas Etapas com Insumo Linkado à Headline

### Objetivo

Transformar o `TipoRoteiroDialog` em um fluxo de duas etapas:
1. **Etapa 1**: Gerar/editar "insumos" (ideias pouco conhecidas) para cada headline
2. **Etapa 2**: Selecionar tipo de roteiro e gerar (fluxo atual)

O insumo ficará linkado à mesma headline e será enviado junto no webhook.

---

### Interface Proposta (Duas Colunas)

```text
+--------------------------------------------+------------------------------------------+
|  1: extração do conteúdo notável           |  2: Selecionar estilo do roteiro         |
|                                            |           (opacidade 50%)                |
+--------------------------------------------+------------------------------------------+
|                                            |                                          |
|  [✓] Selecionar todas (11)                 |  [✓] Selecionar todas                    |
|                                            |  4 selecionadas [Tipo ▼] [Aplicar]       |
|  +--------------------------------------+  |  +------------------------------------+  |
|  | HEADLINE 1:                          |  |  | [✓] HEADLINE 1:                    |  |
|  | Truques proibidões da neurociência...|  |  |     Truques proibidões...          |  |
|  |                                      |  |  |     Tipo: [Selecionar tipo ▼] [⚙] |  |
|  | Insumo:                              |  |  +------------------------------------+  |
|  | +----------------------------------+ |  |  | [✓] HEADLINE 2:                    |  |
|  | | 1: livro "Cérebro sem limites"   | |  |  |     É isso que acontece...         |  |
|  | | 2: estudo de Harvard sobre sono  | |  |  |     Tipo: [Reels ▼] [⚙]           |  |
|  | | 3: dado: 87% das pessoas...      | |  |  +------------------------------------+  |
|  | +----------------------------------+ |  |                                          |
|  +--------------------------------------+  |                                          |
|                                            |                                          |
|  +--------------------------------------+  |                                          |
|  | HEADLINE 2:                          |  |                                          |
|  | É isso que acontece quando...        |  |                                          |
|  | Insumo: [campo editável]             |  |                                          |
|  +--------------------------------------+  |                                          |
|                                            |                                          |
+--------------------------------------------+------------------------------------------+
|  [Gerar Insumos]            [Próximo →]    |  [← Voltar]   [+ Novo tipo]  [Gerar (11)]|
+--------------------------------------------+------------------------------------------+
```

---

### Arquitetura de Dados

```text
HeadlineParaGerar (entrada)
    │
    ▼
+-------------------+     Etapa 1      +-------------------+
| key: "1-1"        | ───────────────► | key: "1-1"        |
| headline: "..."   |                  | headline: "..."   |
| estrutura: "..."  |                  | estrutura: "..."  |
+-------------------+                  | insumo: "1: ..."  |  ◄── NOVO CAMPO
                                       +-------------------+
                                              │
                                              ▼  Etapa 2
                                       +-------------------+
                                       | key: "1-1"        |
                                       | headline: "..."   |
                                       | estrutura: "..."  |
                                       | insumo: "1: ..."  |  ◄── MANTIDO
                                       | tipoId: "abc"     |
                                       | tipoNome: "Reels" |
                                       | tipoConfig: {...} |
                                       +-------------------+
                                              │
                                              ▼
                                       n8n-webhook (payload)
```

---

### Mudanças Técnicas

#### 1. Criar Edge Function: `extract-insumos`

Nova função que usa IA para gerar ideias/insumos para cada headline.

**Arquivo:** `supabase/functions/extract-insumos/index.ts`

```typescript
// Recebe:
{
  mentorado: {
    nome: string,
    informacoes_mentorado: string | null,
    apresentacao: string | null
  },
  headlines: [
    { key: "1-1", headline: "Truques proibidões..." }
  ]
}

// Retorna:
{
  insumos: [
    { key: "1-1", insumo: "1: livro X\n2: estudo Y\n3: dado Z" }
  ]
}
```

**Prompt da IA:**
```text
Você é um especialista em criação de conteúdo viral para redes sociais.

Sua tarefa é extrair "insumos" - ideias, fatos pouco conhecidos, referências 
de livros/estudos que podem tornar o roteiro mais interessante e único.

Para cada headline, sugira 3-5 insumos numerados:
1: [ideia/fato/referência]
2: [ideia/fato/referência]
3: [ideia/fato/referência]

Foque em:
- O nicho/contexto do mentorado
- Fatos surpreendentes ou contra-intuitivos
- Referências de livros, estudos ou especialistas
- Dados estatísticos interessantes
- Histórias ou exemplos memoráveis

Mentorado: {nome}
Contexto: {informacoes_mentorado}
```

#### 2. Atualizar Interface HeadlineComTipo

**Arquivo:** `src/components/mentorados/TipoRoteiroDialog.tsx`

```typescript
export interface HeadlineComTipo {
  key: string;
  headline: string;
  estrutura: string;
  insumo: string;        // ← NOVO CAMPO
  tipoId: string;
  tipoNome: string;
  tipoConfig: {
    prompt: string | null;
    template_estrutura: string | null;
    config_extra: unknown;
  };
}
```

#### 3. Refatorar TipoRoteiroDialog para Duas Etapas

**Novos estados:**

```typescript
// Etapa atual
const [currentStep, setCurrentStep] = useState<1 | 2>(1);

// Insumos por headline (editáveis)
const [insumos, setInsumos] = useState<Record<string, string>>({});

// Loading da geração de insumos
const [isGeneratingInsumos, setIsGeneratingInsumos] = useState(false);
```

**Funções novas:**

```typescript
// Gerar insumos via Edge Function
const handleGenerateInsumos = async () => {
  setIsGeneratingInsumos(true);
  try {
    const { data, error } = await supabase.functions.invoke("extract-insumos", {
      body: {
        mentorado: mentoradoData,
        headlines: headlines.map(h => ({ key: h.key, headline: h.headline }))
      }
    });
    
    if (error) throw error;
    
    const newInsumos: Record<string, string> = {};
    data.insumos.forEach((item: { key: string; insumo: string }) => {
      newInsumos[item.key] = item.insumo;
    });
    setInsumos(newInsumos);
  } catch (err) {
    toast.error("Erro ao gerar insumos");
  } finally {
    setIsGeneratingInsumos(false);
  }
};

// Editar insumo individual
const handleInsumoChange = (key: string, value: string) => {
  setInsumos(prev => ({ ...prev, [key]: value }));
};
```

**handleConfirm atualizado (inclui insumo):**

```typescript
const handleConfirm = () => {
  const result: HeadlineComTipo[] = headlines.map(headline => {
    const tipoId = selectedTipos[headline.key];
    const tipo = tipos.find(t => t.id === tipoId);
    return {
      ...headline,
      insumo: insumos[headline.key] || "",  // ← INCLUIR INSUMO
      tipoId,
      tipoNome: tipo?.nome || "",
      tipoConfig: { ... }
    };
  });
  
  onOpenChange(false);
  onStartBulkGeneration(result);
};
```

**Layout em duas colunas:**

```typescript
<DialogContent className="sm:max-w-5xl max-h-[85vh] flex flex-col">
  <DialogHeader>
    <DialogTitle>Gerar Roteiro</DialogTitle>
  </DialogHeader>
  
  <div className="flex gap-6 flex-1 min-h-0">
    {/* COLUNA 1 - Insumos */}
    <div className={cn(
      "flex-1 flex flex-col border-r pr-6 transition-opacity",
      currentStep === 2 && "opacity-50 pointer-events-none"
    )}>
      <h3 className="font-medium text-lg mb-4">1: extração do conteúdo notável</h3>
      
      <ScrollArea className="flex-1 max-h-[400px]">
        {headlines.map((h, i) => (
          <div key={h.key} className="border rounded-lg p-4 mb-4">
            <span className="text-xs text-muted-foreground">HEADLINE {i+1}:</span>
            <p className="text-sm font-medium line-clamp-2">{h.headline}</p>
            
            <div className="mt-3">
              <Label className="text-xs">Insumo</Label>
              <Textarea
                value={insumos[h.key] || ""}
                onChange={(e) => handleInsumoChange(h.key, e.target.value)}
                placeholder="1: ideia ou referência..."
                className="mt-1 min-h-[80px]"
              />
            </div>
          </div>
        ))}
      </ScrollArea>
      
      <div className="flex justify-between pt-4 border-t mt-4">
        <Button variant="outline" onClick={handleGenerateInsumos} disabled={isGeneratingInsumos}>
          {isGeneratingInsumos && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
          Gerar Insumos
        </Button>
        <Button onClick={() => setCurrentStep(2)}>
          Próximo →
        </Button>
      </div>
    </div>
    
    {/* COLUNA 2 - Tipos (conteúdo atual) */}
    <div className={cn(
      "flex-1 flex flex-col transition-opacity",
      currentStep === 1 && "opacity-50"
    )}>
      <h3 className="font-medium text-lg mb-4">2: Selecionar estilo do roteiro</h3>
      
      {/* Barra de seleção em massa (já existente) */}
      {/* ScrollArea com headlines e selects de tipo (já existente) */}
      
      <div className="flex justify-between pt-4 border-t mt-4">
        <Button variant="outline" onClick={() => setCurrentStep(1)}>
          ← Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!allHeadlinesHaveTipo}>
            Gerar ({headlines.length})
          </Button>
        </div>
      </div>
    </div>
  </div>
</DialogContent>
```

#### 4. Atualizar Payload do n8n-webhook

**Arquivo:** `src/components/mentorados/MentoradoRoteirosView.tsx`

Na função `processBulkGeneration`, incluir o insumo:

```typescript
const { data, error } = await supabase.functions.invoke("n8n-webhook", {
  body: {
    mentorado: {
      nome: mentoradoNome,
      informacoes_mentorado: currentMentorado?.informacoes_mentorado,
      apresentacao: currentMentorado?.apresentacao,
    },
    roteiros: [{
      key: item.key,
      headline: item.headline,
      estrutura: item.estrutura,
      insumo: item.insumo,           // ← NOVO CAMPO
      tipo_roteiro: item.tipoNome,
      tipo_config: item.tipoConfig,
    }],
  },
});
```

---

### Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/extract-insumos/index.ts` | **CRIAR** - Edge function para gerar insumos com IA |
| `src/components/mentorados/TipoRoteiroDialog.tsx` | Adicionar duas etapas, estados de insumos, layout em colunas |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Incluir insumo no payload enviado ao webhook |

---

### Fluxo de Uso

1. Usuário seleciona headlines e clica "Gerar roteiro"
2. Dialog abre na **Etapa 1** (coluna esquerda ativa, direita semi-apagada)
3. Usuário clica "Gerar Insumos" → IA preenche sugestões em cada campo
4. Usuário edita os insumos conforme necessário
5. Usuário clica "Próximo →" → vai para **Etapa 2** (coluna direita ativa)
6. Usuário seleciona tipos de roteiro (fluxo já existente)
7. Usuário clica "Gerar" → roteiros são gerados com insumos incluídos no payload

---

### Dados Enviados ao n8n (exemplo)

```json
{
  "mentorado": {
    "nome": "João Silva",
    "informacoes_mentorado": "Nicho: finanças pessoais...",
    "apresentacao": "Especialista em investimentos..."
  },
  "roteiros": [{
    "key": "1-1",
    "headline": "Truques proibidões da neurociência para acordar antes das 5",
    "estrutura": "",
    "insumo": "1: livro 'Cérebro sem limites' de Jim Kwik\n2: estudo de Harvard mostra que acordar cedo aumenta produtividade em 23%\n3: técnica do 'power hour' usada por Tim Ferriss",
    "tipo_roteiro": "Reels",
    "tipo_config": { "prompt": "...", "template_estrutura": "..." }
  }]
}
```

O n8n receberá o campo `insumo` linkado diretamente à headline correspondente.

