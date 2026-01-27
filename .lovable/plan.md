

## Plano: Separar Etapas e Usar Webhook n8n para Insumos

### Objetivo

1. **Separar as duas etapas** - Em vez de lado a lado, mostrar uma por vez (tabs ou navegação)
2. **Enviar webhook n8n para gerar insumos** - Disparar um webhook por headline (um de cada vez) para `https://madarawin.app.n8n.cloud/webhook-test/agente-ia-lovable-insumo`
3. **Adicionar botão "Reprocessar"** - Para cada insumo, permitir reenviar o webhook caso o usuário não goste do resultado
4. **Receber e exibir resposta do n8n** - O webhook retorna o insumo gerado

---

### Interface Proposta

```text
ETAPA 1 (quando ativa):
+------------------------------------------------------------------+
|  Gerar Roteiro                                                    |
+------------------------------------------------------------------+
|                                                                   |
|  ● 1: extração do conteúdo notável    ○ 2: Selecionar estilo     |
|                                                                   |
+------------------------------------------------------------------+
|                                                                   |
|  +------------------------------------------------------------+  |
|  | HEADLINE 1:                                                 |  |
|  | Truques proibidões da neurociência para acordar antes das 5 |  |
|  |                                                             |  |
|  | Insumo:                                                     |  |
|  | +--------------------------------------------------------+ |  |
|  | | 1: livro "Cérebro sem limites" de Jim Kwik              | |  |
|  | | 2: estudo de Harvard sobre cronotipos                   | |  |
|  | | 3: dado: 87% das pessoas dormem menos do recomendado    | |  |
|  | +--------------------------------------------------------+ |  |
|  |                                     [🔄 Reprocessar]        |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  +------------------------------------------------------------+  |
|  | HEADLINE 2:                                                 |  |
|  | É isso que acontece quando você...                          |  |
|  |                                                             |  |
|  | Insumo:                            [⏳ Gerando...]          |  |
|  +------------------------------------------------------------+  |
|                                                                   |
+------------------------------------------------------------------+
|  [Gerar Insumos]                              [Próximo →]         |
+------------------------------------------------------------------+
```

```text
ETAPA 2 (quando ativa):
+------------------------------------------------------------------+
|  Gerar Roteiro                                                    |
+------------------------------------------------------------------+
|                                                                   |
|  ○ 1: extração do conteúdo notável    ● 2: Selecionar estilo     |
|                                                                   |
+------------------------------------------------------------------+
|                                                                   |
|  [Conteúdo atual da etapa 2 - seleção de tipos]                  |
|                                                                   |
+------------------------------------------------------------------+
|  [← Voltar]                    [Cancelar]  [Gerar (11)]           |
+------------------------------------------------------------------+
```

---

### Arquitetura

```text
Fluxo de Geração de Insumos:
                                                                      
  ┌─────────────────┐                                                 
  │ Clica "Gerar    │                                                 
  │ Insumos"        │                                                 
  └────────┬────────┘                                                 
           │                                                          
           ▼                                                          
  ┌─────────────────┐     Para cada headline (sequencial)             
  │ Loop sequencial │◄─────────────────────────────────────┐          
  │ headline por    │                                      │          
  │ headline        │                                      │          
  └────────┬────────┘                                      │          
           │                                               │          
           ▼                                               │          
  ┌─────────────────┐                                      │          
  │ Edge Function   │     POST para n8n webhook-test       │          
  │ n8n-insumo      │──────────────────────────────────►   │          
  └────────┬────────┘                                      │          
           │                                               │          
           ▼                                               │          
  ┌─────────────────┐                                      │          
  │ n8n retorna     │     { insumo: "1: ideia X\n2:..." }  │          
  │ insumo gerado   │◄─────────────────────────────────    │          
  └────────┬────────┘                                      │          
           │                                               │          
           ▼                                               │          
  ┌─────────────────┐                                      │          
  │ Atualiza UI     │     Mostra insumo no campo           │          
  │ em tempo real   │                                      │          
  └────────┬────────┘                                      │          
           │                                               │          
           └──────────────► Próxima headline ──────────────┘          
```

---

### Mudanças Técnicas

#### 1. Criar Nova Edge Function: `n8n-insumo`

Dispara uma headline por vez para o webhook de insumos do n8n.

**Arquivo:** `supabase/functions/n8n-insumo/index.ts`

```typescript
// Recebe (uma headline por vez):
{
  mentorado: {
    nome: string,
    informacoes_mentorado: string | null,
    apresentacao: string | null
  },
  headline: {
    key: string,
    headline: string
  }
}

// Retorna:
{
  key: "1-1",
  insumo: "1: livro X\n2: estudo Y\n3: dado Z"
}
```

O webhook chamado será:
`https://madarawin.app.n8n.cloud/webhook-test/agente-ia-lovable-insumo`

A resposta do n8n será parseada e retornada ao frontend.

#### 2. Refatorar TipoRoteiroDialog - Layout em Etapas

**Layout:** Em vez de duas colunas lado a lado, mostrar apenas a etapa ativa com navegação por tabs/indicadores.

```typescript
// Estados adicionais:
const [loadingInsumoKeys, setLoadingInsumoKeys] = useState<Set<string>>(new Set());

// Gerar insumos um por um via n8n
const handleGenerateInsumos = async () => {
  setIsGeneratingInsumos(true);
  
  for (const headline of headlines) {
    setLoadingInsumoKeys(prev => new Set(prev).add(headline.key));
    
    try {
      const { data, error } = await supabase.functions.invoke("n8n-insumo", {
        body: {
          mentorado: mentoradoData,
          headline: { key: headline.key, headline: headline.headline }
        }
      });
      
      if (error) throw error;
      
      if (data?.insumo) {
        setInsumos(prev => ({ ...prev, [headline.key]: data.insumo }));
      }
    } catch (err) {
      console.error(`Erro ao gerar insumo para ${headline.key}:`, err);
    } finally {
      setLoadingInsumoKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(headline.key);
        return newSet;
      });
    }
  }
  
  setIsGeneratingInsumos(false);
};

// Reprocessar um insumo específico
const handleReprocessInsumo = async (headline: HeadlineParaGerar) => {
  setLoadingInsumoKeys(prev => new Set(prev).add(headline.key));
  
  try {
    const { data, error } = await supabase.functions.invoke("n8n-insumo", {
      body: {
        mentorado: mentoradoData,
        headline: { key: headline.key, headline: headline.headline }
      }
    });
    
    if (error) throw error;
    
    if (data?.insumo) {
      setInsumos(prev => ({ ...prev, [headline.key]: data.insumo }));
    }
  } catch (err) {
    toast({ title: "Erro ao reprocessar", variant: "destructive" });
  } finally {
    setLoadingInsumoKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(headline.key);
      return newSet;
    });
  }
};
```

**UI da Etapa 1 (separada):**

```typescript
{currentStep === 1 && (
  <div className="flex flex-col flex-1">
    {/* Indicadores de etapa */}
    <div className="flex items-center gap-4 mb-6 pb-4 border-b">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">1</div>
        <span className="font-medium">extração do conteúdo notável</span>
      </div>
      <div className="h-px flex-1 bg-border" />
      <div className="flex items-center gap-2 opacity-50">
        <div className="w-6 h-6 rounded-full border flex items-center justify-center text-sm">2</div>
        <span>Selecionar estilo</span>
      </div>
    </div>
    
    {/* Lista de headlines com insumos */}
    <ScrollArea className="flex-1 max-h-[400px]">
      {headlines.map((headline, index) => (
        <div key={headline.key} className="border rounded-lg p-4 mb-4">
          <span className="text-xs text-muted-foreground">HEADLINE {index + 1}:</span>
          <p className="text-sm font-medium mt-1">{headline.headline}</p>
          
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs">Insumo</Label>
              {insumos[headline.key] && !loadingInsumoKeys.has(headline.key) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleReprocessInsumo(headline)}
                  className="h-6 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reprocessar
                </Button>
              )}
            </div>
            
            {loadingInsumoKeys.has(headline.key) ? (
              <div className="flex items-center gap-2 p-3 border rounded bg-muted/50">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Gerando insumo...</span>
              </div>
            ) : (
              <Textarea
                value={insumos[headline.key] || ""}
                onChange={(e) => handleInsumoChange(headline.key, e.target.value)}
                placeholder="1: ideia ou referência..."
                className="min-h-[80px] text-sm"
              />
            )}
          </div>
        </div>
      ))}
    </ScrollArea>
    
    {/* Botões de ação */}
    <div className="flex justify-between pt-4 border-t mt-4">
      <Button variant="outline" onClick={handleGenerateInsumos} disabled={isGeneratingInsumos}>
        {isGeneratingInsumos ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
        Gerar Insumos
      </Button>
      <Button onClick={() => setCurrentStep(2)}>
        Próximo <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  </div>
)}

{currentStep === 2 && (
  <div className="flex flex-col flex-1">
    {/* Indicadores de etapa */}
    <div className="flex items-center gap-4 mb-6 pb-4 border-b">
      <div className="flex items-center gap-2 opacity-50">
        <div className="w-6 h-6 rounded-full border flex items-center justify-center text-sm">1</div>
        <span>extração do conteúdo notável</span>
      </div>
      <div className="h-px flex-1 bg-border" />
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">2</div>
        <span className="font-medium">Selecionar estilo</span>
      </div>
    </div>
    
    {/* Conteúdo atual da etapa 2 */}
    {/* ... */}
  </div>
)}
```

---

### Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/n8n-insumo/index.ts` | **CRIAR** - Proxy para webhook de insumos do n8n (1 headline por vez) |
| `supabase/config.toml` | Adicionar configuração da nova função |
| `src/components/mentorados/TipoRoteiroDialog.tsx` | Refatorar para mostrar etapas separadas + botão reprocessar |

---

### Payload Enviado ao n8n

```json
{
  "mentorado": {
    "nome": "João Silva",
    "informacoes_mentorado": "Nicho: finanças pessoais...",
    "apresentacao": "Especialista em investimentos..."
  },
  "headline": {
    "key": "1-1",
    "headline": "Truques proibidões da neurociência para acordar antes das 5"
  }
}
```

O n8n deve retornar algo como:
```json
{
  "insumo": "1: livro 'Cérebro sem limites' de Jim Kwik\n2: estudo de Harvard...\n3: técnica do 'power hour'..."
}
```

Ou se retornar diferente, a Edge Function vai parsear e adaptar.

---

### Fluxo de Uso

1. Usuário seleciona headlines e clica "Gerar roteiro"
2. Dialog abre na **Etapa 1** (única etapa visível, etapa 2 indicada como próxima)
3. Usuário clica "Gerar Insumos" → Dispara webhook para n8n **uma headline por vez**
4. Cada insumo é preenchido conforme resposta do n8n chega
5. Usuário pode **editar** o insumo ou clicar **"Reprocessar"** para gerar novamente
6. Usuário clica "Próximo →" → vai para **Etapa 2**
7. Etapa 2 funciona igual ao fluxo atual (selecionar tipos e gerar)

