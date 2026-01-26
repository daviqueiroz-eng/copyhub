

## Plano: Seleção Múltipla de Headlines + Correção de Scroll

### Objetivo

Implementar duas melhorias no TipoRoteiroDialog:
1. Permitir selecionar múltiplas headlines e aplicar um único tipo para todas de uma vez
2. Corrigir o scroll para conseguir ver todas as headlines selecionadas

---

### Problema 1: Seleção Individual Ineficiente

#### Comportamento Atual
- Cada headline tem seu próprio dropdown de tipo
- Precisa selecionar tipo para cada headline individualmente
- Processo demorado quando há muitas headlines

#### Novo Comportamento
- Adicionar checkboxes ao lado de cada headline para seleção múltipla
- Dropdown global no topo: "Aplicar tipo às selecionadas"
- Botão "Selecionar todas" para facilitar
- Ao selecionar tipo no dropdown global, aplica a todas as headlines marcadas

---

### Problema 2: Scroll Não Funciona

#### Causa
- O ScrollArea precisa de uma altura fixa definida para funcionar
- Atualmente usa `flex-1` que pode não calcular altura corretamente no contexto do Dialog

#### Solução
- Adicionar altura máxima fixa ao ScrollArea (ex: `max-h-[400px]`)
- Garantir overflow correto no viewport

---

### Interface Proposta

```text
+----------------------------------------------------------+
|  Gerar Roteiro                                      [X]  |
+----------------------------------------------------------+
|                                                          |
|  [✓] Selecionar todas    [Tipo: Dropdown ▼] [Aplicar]    |
|                                                          |
|  +----------------------------------------------------+  |
|  | [✓] HEADLINE 1:                                    |  |
|  |     faça essas 3 coisas se quiser...              |  |
|  |     Tipo: [Selecionar tipo ▼] [⚙]                 |  |
|  +----------------------------------------------------+  |
|  | [✓] HEADLINE 2:                                    |  |
|  |     eu não sei quem precisa ouvir isso...         |  |
|  |     Tipo: [Selecionar tipo ▼] [⚙]                 |  |
|  +----------------------------------------------------+  |
|  | [ ] HEADLINE 3:                                    |  |
|  |     (sem headline)                                 |  |
|  |     Tipo: [Selecionar tipo ▼] [⚙]                 |  |
|  +----------------------------------------------------+  |
|                      ↓ scroll ↓                          |
|                                                          |
|  [+ Novo tipo]                    [Cancelar] [Gerar (4)] |
+----------------------------------------------------------+
```

---

### Mudanças Técnicas

#### TipoRoteiroDialog.tsx

**Novos estados:**
```typescript
// Headlines selecionadas para aplicação em massa
const [selectedHeadlines, setSelectedHeadlines] = useState<Set<string>>(new Set());

// Tipo selecionado para aplicar em massa
const [bulkTipoId, setBulkTipoId] = useState<string>("");
```

**Funções de seleção múltipla:**
```typescript
// Toggle seleção de uma headline
const toggleHeadlineSelection = (key: string) => {
  setSelectedHeadlines(prev => {
    const newSet = new Set(prev);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    return newSet;
  });
};

// Selecionar todas
const selectAllHeadlines = () => {
  if (selectedHeadlines.size === headlines.length) {
    setSelectedHeadlines(new Set());
  } else {
    setSelectedHeadlines(new Set(headlines.map(h => h.key)));
  }
};

// Aplicar tipo às selecionadas
const applyBulkTipo = () => {
  if (!bulkTipoId) return;
  
  setSelectedTipos(prev => {
    const newTipos = { ...prev };
    selectedHeadlines.forEach(key => {
      newTipos[key] = bulkTipoId;
    });
    return newTipos;
  });
  
  // Limpar seleção após aplicar
  setSelectedHeadlines(new Set());
  setBulkTipoId("");
};
```

**Correção do ScrollArea:**
```typescript
<ScrollArea className="flex-1 max-h-[400px]">
  <div className="py-4 space-y-4 pr-4">
    {/* headlines... */}
  </div>
</ScrollArea>
```

**UI - Barra de seleção em massa:**
```typescript
{/* Barra de ações em massa */}
<div className="flex items-center gap-3 py-3 border-b">
  <div className="flex items-center gap-2">
    <Checkbox
      id="select-all"
      checked={selectedHeadlines.size === headlines.length && headlines.length > 0}
      onCheckedChange={selectAllHeadlines}
    />
    <Label htmlFor="select-all" className="text-sm cursor-pointer">
      Selecionar todas
    </Label>
  </div>
  
  {selectedHeadlines.size > 0 && (
    <>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-2 flex-1">
        <span className="text-xs text-muted-foreground">
          {selectedHeadlines.size} selecionadas
        </span>
        <Select value={bulkTipoId} onValueChange={setBulkTipoId}>
          <SelectTrigger className="h-8 w-[180px]">
            <SelectValue placeholder="Tipo para aplicar" />
          </SelectTrigger>
          <SelectContent>
            {tipos.map((tipo) => (
              <SelectItem key={tipo.id} value={tipo.id}>
                {tipo.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          size="sm" 
          onClick={applyBulkTipo}
          disabled={!bulkTipoId}
        >
          Aplicar
        </Button>
      </div>
    </>
  )}
</div>
```

**Checkbox em cada headline:**
```typescript
<div key={headline.key} className="border rounded-lg p-4 space-y-3">
  <div className="flex items-start gap-3">
    <Checkbox
      checked={selectedHeadlines.has(headline.key)}
      onCheckedChange={() => toggleHeadlineSelection(headline.key)}
      className="mt-0.5"
    />
    <div className="flex-1">
      <span className="text-xs text-muted-foreground font-medium">
        HEADLINE {index + 1}:
      </span>
      <p className="text-sm font-medium mt-1 line-clamp-2">
        {headline.headline || "(sem headline)"}
      </p>
    </div>
  </div>
  {/* Select individual... */}
</div>
```

---

### Arquivo a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/mentorados/TipoRoteiroDialog.tsx` | Adicionar seleção múltipla, aplicação em massa e corrigir scroll |

---

### Fluxo de Uso

**Cenário 1: Aplicar mesmo tipo a todas**
1. Usuário clica em "Selecionar todas"
2. Escolhe o tipo no dropdown "Tipo para aplicar"
3. Clica em "Aplicar"
4. Todos os tipos são preenchidos
5. Clica em "Gerar"

**Cenário 2: Tipos diferentes para algumas**
1. Usuário seleciona headlines 1, 2, 3 (checkbox)
2. Escolhe tipo "Reels" e clica "Aplicar"
3. Seleciona headline 4
4. Escolhe tipo "Stories" e clica "Aplicar"
5. Clica em "Gerar"

**Cenário 3: Misto**
1. Aplica tipo em massa para a maioria
2. Ajusta tipos individuais usando o dropdown de cada headline

