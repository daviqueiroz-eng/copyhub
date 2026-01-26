

## Plano: Histórico de Alterações no Modo Revisão (Undo/Redo)

### Objetivo

Adicionar a capacidade de voltar/desfazer alterações feitas no roteiro durante o modo revisão, tanto edições manuais quanto alterações feitas pela IA.

---

### Interface Proposta

Adicionar botões de Undo/Redo no header do modo revisão:

```text
+-----------------------------------------------------------------------------+
|  [X]  Roteiro 1/1 (Davi teste - Guia 2)          [↩] [↪]   [< Anterior] [Próximo >] [X] |
+-----------------------------------------------------------------------------+
|                                      |                                      |
|     HEADLINE 04:                     |   Chat de Revisão                    |
|     [texto editável]                 |                                      |
|                                      |   [mensagens...]                     |
|     ESTRUTURA 04:                    |                                      |
|     [texto editável]                 |   [input]                            |
+-----------------------------------------------------------------------------+
```

- **↩ Desfazer**: Volta para a versão anterior
- **↪ Refazer**: Avança para a versão seguinte (se já deu undo)
- Atalhos de teclado: Ctrl+Z (undo) e Ctrl+Shift+Z (redo)

---

### Lógica de Histórico

1. **Stack de histórico por roteiro**
   - Cada roteiro terá seu próprio histórico de versões
   - Limite de 50 versões para não consumir muita memória

2. **Quando salvar no histórico**
   - Após cada alteração da IA (quando `data.changed = true`)
   - Após edição manual (quando fizer blur do campo ou mudar de roteiro)
   - Não salvar a cada caractere digitado (apenas no debounce)

3. **Estrutura do histórico**
```typescript
interface HistoryEntry {
  headline: string;
  estrutura: string;
  timestamp: Date;
  source: "manual" | "ai";
}

// Estado para histórico
const [historyPerRoteiro, setHistoryPerRoteiro] = useState<Map<string, {
  entries: HistoryEntry[];
  currentIndex: number;
}>>(new Map());
```

---

### Mudanças Técnicas

#### RoteiroRevisaoDialog.tsx

**Novos estados:**
```typescript
// Histórico de alterações por roteiro
const [historyPerRoteiro, setHistoryPerRoteiro] = useState<Map<string, {
  entries: HistoryEntry[];
  currentIndex: number;
}>>(new Map());
```

**Funções de histórico:**
```typescript
// Salvar snapshot no histórico
const saveToHistory = (source: "manual" | "ai") => {
  setHistoryPerRoteiro(prev => {
    const newMap = new Map(prev);
    const current = newMap.get(currentKey) || { entries: [], currentIndex: -1 };
    
    // Remover entradas futuras se estamos no meio do histórico
    const newEntries = current.entries.slice(0, current.currentIndex + 1);
    
    // Adicionar nova entrada
    newEntries.push({
      headline: localHeadline,
      estrutura: localEstrutura,
      timestamp: new Date(),
      source,
    });
    
    // Limitar a 50 entradas
    if (newEntries.length > 50) newEntries.shift();
    
    newMap.set(currentKey, {
      entries: newEntries,
      currentIndex: newEntries.length - 1,
    });
    
    return newMap;
  });
};

// Desfazer (Undo)
const handleUndo = () => {
  const history = historyPerRoteiro.get(currentKey);
  if (!history || history.currentIndex <= 0) return;
  
  const newIndex = history.currentIndex - 1;
  const entry = history.entries[newIndex];
  
  setLocalHeadline(entry.headline);
  setLocalEstrutura(entry.estrutura);
  onRoteiroChange(currentKey, "headline", entry.headline);
  onRoteiroChange(currentKey, "estrutura", entry.estrutura);
  
  setHistoryPerRoteiro(prev => {
    const newMap = new Map(prev);
    newMap.set(currentKey, { ...history, currentIndex: newIndex });
    return newMap;
  });
};

// Refazer (Redo)
const handleRedo = () => {
  const history = historyPerRoteiro.get(currentKey);
  if (!history || history.currentIndex >= history.entries.length - 1) return;
  
  const newIndex = history.currentIndex + 1;
  const entry = history.entries[newIndex];
  
  setLocalHeadline(entry.headline);
  setLocalEstrutura(entry.estrutura);
  onRoteiroChange(currentKey, "headline", entry.headline);
  onRoteiroChange(currentKey, "estrutura", entry.estrutura);
  
  setHistoryPerRoteiro(prev => {
    const newMap = new Map(prev);
    newMap.set(currentKey, { ...history, currentIndex: newIndex });
    return newMap;
  });
};
```

**Atalhos de teclado:**
```typescript
// Adicionar no useEffect de keydown
if ((e.ctrlKey || e.metaKey) && e.key === "z") {
  e.preventDefault();
  if (e.shiftKey) {
    handleRedo();
  } else {
    handleUndo();
  }
}
```

**UI - Botões no header:**
```typescript
<div className="flex items-center gap-1">
  <Button
    variant="ghost"
    size="icon"
    onClick={handleUndo}
    disabled={!canUndo}
    title="Desfazer (Ctrl+Z)"
    className="h-8 w-8"
  >
    <Undo2 className="h-4 w-4" />
  </Button>
  <Button
    variant="ghost"
    size="icon"
    onClick={handleRedo}
    disabled={!canRedo}
    title="Refazer (Ctrl+Shift+Z)"
    className="h-8 w-8"
  >
    <Redo2 className="h-4 w-4" />
  </Button>
  {/* ... botões de navegação existentes ... */}
</div>
```

---

### Quando Salvar no Histórico

1. **Ao abrir roteiro pela primeira vez**: Salvar estado inicial
2. **Após alteração da IA**: Quando `data.changed = true`
3. **No blur dos campos**: Quando usuário sai do campo (edição manual)
4. **Ao mudar de roteiro**: Se há alterações pendentes

---

### Arquivo a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/mentorados/RoteiroRevisaoDialog.tsx` | Adicionar lógica de histórico, botões undo/redo e atalhos de teclado |

---

### Comportamento Esperado

1. Usuário abre modo revisão
2. Versão inicial é salva no histórico
3. Usuário pede para IA alterar algo → Nova versão salva
4. Usuário edita manualmente e sai do campo → Nova versão salva
5. Usuário clica em ↩ Desfazer → Volta para versão anterior
6. Usuário clica em ↪ Refazer → Avança para versão que tinha desfeito
7. Se fizer nova alteração após undo, as versões "futuras" são descartadas

---

### Indicador Visual

Mostrar quantidade de versões disponíveis para undo/redo:

```text
[↩ 3] [↪ 1]
```

Ou tooltip com informação: "3 alterações para desfazer"

