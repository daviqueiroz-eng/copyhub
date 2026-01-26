
## Plano: Disparo em Massa com Fila e Progresso

### Objetivo

Implementar um sistema de disparo em massa que processa os roteiros um a um (ou em lotes pequenos), mostrando o progresso em tempo real para o usuário.

---

### Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────┐
│                    TipoRoteiroDialog                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Estado de Progresso                                      │  │
│  │  - total: 5 roteiros                                      │  │
│  │  - processados: 2                                         │  │
│  │  - atual: "Gerando roteiro 3/5..."                       │  │
│  │  - resultados: [{key, status, estrutura}]                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Progress Bar                                             │  │
│  │  ████████████░░░░░░░░░░░░░░░░░░░░░░  40%                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Cancelar]                              [Gerar (5)] → [X/5]   │
└─────────────────────────────────────────────────────────────────┘
```

---

### Fluxo de Processamento

1. Usuário clica em "Gerar"
2. Sistema cria uma fila com todos os roteiros selecionados
3. Para cada roteiro na fila:
   - Envia para o webhook (1 roteiro por vez)
   - Aguarda resposta
   - Atualiza estado local e progresso
   - Salva no banco
4. Ao finalizar, mostra resumo e fecha dialog

---

### Mudancas Tecnicas

#### 1. TipoRoteiroDialog.tsx

**Novos estados:**
```typescript
const [isProcessing, setIsProcessing] = useState(false);
const [progress, setProgress] = useState({
  total: 0,
  current: 0,
  currentKey: "",
  results: [] as Array<{key: string; success: boolean; estrutura?: string; error?: string}>
});
```

**Nova logica de processamento:**
```typescript
const processQueue = async (queue: HeadlineComTipo[]) => {
  setIsProcessing(true);
  setProgress({ total: queue.length, current: 0, currentKey: "", results: [] });
  
  const results: ProcessResult[] = [];
  
  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    setProgress(prev => ({ ...prev, current: i + 1, currentKey: item.key }));
    
    try {
      // Enviar 1 roteiro por vez
      const { data, error } = await supabase.functions.invoke("n8n-webhook", {
        body: {
          mentorado: { ... },
          roteiros: [{ 
            key: item.key, 
            headline: item.headline,
            tipo_roteiro: item.tipoNome,
            tipo_config: item.tipoConfig 
          }]
        }
      });
      
      if (data?.roteiros?.[0]) {
        results.push({ 
          key: item.key, 
          success: true, 
          estrutura: data.roteiros[0].estrutura 
        });
        // Callback parcial para atualizar UI em tempo real
        onPartialResult?.(item.key, data.roteiros[0].estrutura);
      }
    } catch (err) {
      results.push({ key: item.key, success: false, error: err.message });
    }
    
    setProgress(prev => ({ ...prev, results }));
  }
  
  setIsProcessing(false);
  onConfirm(queue, { roteiros: results.filter(r => r.success).map(r => ({ key: r.key, estrutura: r.estrutura! })) });
};
```

**UI de progresso:**
```tsx
{isProcessing && (
  <div className="space-y-3 py-4">
    <div className="flex items-center justify-between text-sm">
      <span>Gerando roteiro {progress.current}/{progress.total}...</span>
      <span className="text-muted-foreground">{Math.round((progress.current / progress.total) * 100)}%</span>
    </div>
    <Progress value={(progress.current / progress.total) * 100} />
    <p className="text-xs text-muted-foreground">
      Processando: {progress.currentKey}
    </p>
  </div>
)}
```

#### 2. Props do TipoRoteiroDialog

Adicionar callback para resultados parciais:
```typescript
interface TipoRoteiroDialogProps {
  // ... existentes
  onPartialResult?: (key: string, estrutura: string) => void;
}
```

#### 3. MentoradoRoteirosView.tsx

Passar callback para atualizar roteiros em tempo real:
```typescript
<TipoRoteiroDialog
  // ... existentes
  onPartialResult={(key, estrutura) => {
    // Atualizar estado local imediatamente
    setRoteirosLocais(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(key);
      if (existing) {
        newMap.set(key, { ...existing, estrutura });
      }
      return newMap;
    });
    
    // Persistir no banco
    const [guiaNumero, ordem] = key.split("-").map(Number);
    upsertRoteiro.mutate({
      mentoradoId,
      guiaNumero,
      ordem,
      headline: roteirosLocais.get(key)?.headline || "",
      estrutura
    });
  }}
/>
```

---

### Interface Durante Processamento

```text
┌─────────────────────────────────────────────────────────────┐
│  Gerando Roteiros                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Gerando roteiro 3/5...                              60%    │
│  ████████████████████████░░░░░░░░░░░░░░░░                  │
│                                                             │
│  ✓ 1-2: Concluído                                          │
│  ✓ 1-3: Concluído                                          │
│  ⏳ 1-4: Processando...                                     │
│  ○ 1-5: Aguardando                                         │
│  ○ 1-6: Aguardando                                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Cancelar]                                                 │
└─────────────────────────────────────────────────────────────┘
```

---

### Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `src/components/mentorados/TipoRoteiroDialog.tsx` | Adicionar estados de progresso, logica de fila e UI de processamento |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Passar callback `onPartialResult` para atualizacao em tempo real |

---

### Beneficios

1. **Feedback visual**: Usuario ve exatamente o que esta acontecendo
2. **Resiliencia**: Se um roteiro falhar, os outros continuam
3. **Atualizacao em tempo real**: Cada roteiro aparece na tela assim que e gerado
4. **Persistencia imediata**: Cada roteiro e salvo no banco assim que retorna
