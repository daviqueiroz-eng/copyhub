

## Plano: Layout Lado a Lado com Scroll e Textarea Dinâmico

### Objetivo

1. Mostrar **Etapa 1 e Etapa 2 lado a lado** (duas colunas)
2. Quando estiver na Etapa 1 → Etapa 2 fica com **opacity-50** e **pointer-events-none**
3. Quando estiver na Etapa 2 → Etapa 1 fica com **opacity-50** e **pointer-events-none**
4. Cada coluna tem **scroll vertical independente**
5. Textarea do insumo tem **altura dinâmica** baseada no conteúdo retornado

---

### Interface Visual

```text
+------------------------------------------------------------------+
|  Gerar Roteiro                                               X   |
+------------------------------------------------------------------+
|                                                                   |
|  ① extração do conteúdo notável ─────────── ② Selecionar estilo  |
|                                                                   |
+-------------------------------+-----------------------------------+
|  [COLUNA 1 - ATIVA]           |  [COLUNA 2 - OPACIDADE 50%]       |
|                               |                                   |
|  HEADLINE 1:                  |  ○ Selecionar todas               |
|  a neurociência é muito...    |                                   |
|                               |  HEADLINE 1:                      |
|  Insumo      [Reprocessar]    |  a neurociência é muito...        |
|  +-------------------------+  |  📝 Insumo: 1. Dormir após...     |
|  | 1. Dormir após as 23h   |  |  Tipo: [Selecionar tipo ▼]        |
|  | pode prejudicar...      |  |                                   |
|  |                         |  |  HEADLINE 2:                      |
|  | 2. O sono tardio        |  |  Em 2026, essa nova...            |
|  | interfere na memória... |  |  📝 Insumo: 1. A tecnologia...    |
|  |                         |  |  Tipo: [Selecionar tipo ▼]        |
|  | 3. Dormir tarde está    |  |                                   |
|  | ligado à redução...     |  |  (scroll independente)            |
|  +-------------------------+  |                                   |
|                               |                                   |
|  (scroll independente)        |                                   |
+-------------------------------+-----------------------------------+
|  [Gerar Insumos]  [Próximo →] |  [← Voltar] [+ Novo tipo]         |
|                               |             [Cancelar] [Gerar (3)]|
+-------------------------------+-----------------------------------+
```

---

### Mudanças Técnicas

#### 1. Expandir largura do Dialog

De `sm:max-w-3xl` para `sm:max-w-6xl` para acomodar duas colunas.

```typescript
<DialogContent className="sm:max-w-6xl max-h-[85vh] flex flex-col">
```

#### 2. Layout em Duas Colunas

Remover a renderização condicional `{currentStep === 1 && ...}` e mostrar ambas as colunas sempre, aplicando classes de opacidade:

```typescript
<div className="flex gap-6 flex-1 min-h-0 overflow-hidden">
  {/* COLUNA 1 - Insumos */}
  <div className={cn(
    "flex-1 flex flex-col min-w-0 transition-opacity duration-200",
    currentStep === 2 && "opacity-50 pointer-events-none"
  )}>
    <ScrollArea className="flex-1">
      {/* Conteúdo da etapa 1 */}
    </ScrollArea>
    <div className="flex justify-between pt-4 border-t mt-4">
      {/* Botões etapa 1 */}
    </div>
  </div>

  {/* Divisor vertical */}
  <div className="w-px bg-border shrink-0" />

  {/* COLUNA 2 - Tipos */}
  <div className={cn(
    "flex-1 flex flex-col min-w-0 transition-opacity duration-200",
    currentStep === 1 && "opacity-50 pointer-events-none"
  )}>
    <ScrollArea className="flex-1">
      {/* Conteúdo da etapa 2 */}
    </ScrollArea>
    <div className="flex justify-between pt-4 border-t mt-4">
      {/* Botões etapa 2 */}
    </div>
  </div>
</div>
```

#### 3. ScrollArea sem max-height fixo

Remover `max-h-[400px]` e deixar o scroll ocupar o espaço disponível com `flex-1`:

```typescript
<ScrollArea className="flex-1">
  <div className="space-y-4 pr-4">
    {/* Headlines */}
  </div>
</ScrollArea>
```

#### 4. Textarea com Altura Dinâmica

Calcular altura baseada no número de linhas do conteúdo:

```typescript
// Função para calcular altura mínima baseada no conteúdo
const getTextareaMinHeight = (content: string) => {
  if (!content) return 80; // altura padrão
  const lines = content.split('\n').length;
  const lineHeight = 24; // ~24px por linha
  const padding = 16; // padding vertical
  return Math.max(80, (lines * lineHeight) + padding);
};

// No Textarea
<Textarea
  value={insumos[headline.key] || ""}
  onChange={(e) => handleInsumoChange(headline.key, e.target.value)}
  placeholder="1: ideia ou referência..."
  className="text-sm resize-none"
  style={{ 
    minHeight: getTextareaMinHeight(insumos[headline.key] || ""),
    height: 'auto'
  }}
/>
```

**Alternativa com ref e scrollHeight** (mais preciso):

```typescript
// Usar useEffect para ajustar altura automaticamente
const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

const adjustTextareaHeight = (key: string) => {
  const textarea = textareaRefs.current[key];
  if (textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(80, textarea.scrollHeight)}px`;
  }
};

// Quando insumo muda, ajustar altura
useEffect(() => {
  Object.keys(insumos).forEach(key => {
    adjustTextareaHeight(key);
  });
}, [insumos]);

// No Textarea
<Textarea
  ref={(el) => textareaRefs.current[headline.key] = el}
  value={insumos[headline.key] || ""}
  onChange={(e) => {
    handleInsumoChange(headline.key, e.target.value);
    adjustTextareaHeight(headline.key);
  }}
  placeholder="1: ideia ou referência..."
  className="text-sm resize-none overflow-hidden"
  style={{ minHeight: '80px' }}
/>
```

---

### Estrutura Final do Dialog

```typescript
<DialogContent className="sm:max-w-6xl max-h-[85vh] flex flex-col">
  <DialogHeader>
    <DialogTitle>Gerar Roteiro</DialogTitle>
  </DialogHeader>

  {/* Indicadores de etapa (manter como está) */}
  <div className="flex items-center gap-4 pb-4 border-b">
    {/* ... */}
  </div>

  {/* Container das duas colunas */}
  <div className="flex gap-6 flex-1 min-h-0 overflow-hidden">
    
    {/* COLUNA 1 - Insumos */}
    <div className={cn(
      "flex-1 flex flex-col min-w-0 transition-opacity duration-200",
      currentStep === 2 && "opacity-50 pointer-events-none"
    )}>
      <ScrollArea className="flex-1">
        <div className="space-y-4 pr-4">
          {headlines.map((headline, index) => (
            <div key={headline.key} className="border rounded-lg p-4">
              {/* Headline + Textarea com altura dinâmica */}
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="flex justify-between pt-4 border-t mt-4 shrink-0">
        <Button variant="outline" onClick={handleGenerateInsumos}>
          Gerar Insumos
        </Button>
        <Button onClick={() => setCurrentStep(2)}>
          Próximo →
        </Button>
      </div>
    </div>

    {/* Divisor */}
    <div className="w-px bg-border shrink-0" />

    {/* COLUNA 2 - Tipos */}
    <div className={cn(
      "flex-1 flex flex-col min-w-0 transition-opacity duration-200",
      currentStep === 1 && "opacity-50 pointer-events-none"
    )}>
      {/* Barra de seleção em massa */}
      <div className="flex items-center gap-3 py-3 border-b flex-wrap shrink-0">
        {/* ... */}
      </div>

      <ScrollArea className="flex-1">
        <div className="py-4 space-y-4 pr-4">
          {headlines.map((headline, index) => (
            <div key={headline.key} className="border rounded-lg p-4">
              {/* Headline + Select de tipo */}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex justify-between pt-4 border-t mt-4 shrink-0">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCurrentStep(1)}>
            ← Voltar
          </Button>
          <Button variant="outline" onClick={() => setShowAddForm(true)}>
            + Novo tipo
          </Button>
        </div>
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

---

### Arquivo a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/mentorados/TipoRoteiroDialog.tsx` | Refatorar para layout em duas colunas + scroll + textarea dinâmico |

---

### Comportamento Esperado

1. Dialog abre com **ambas as colunas visíveis**
2. Inicialmente **Etapa 1 ativa** (coluna esquerda normal, coluna direita com opacity 50%)
3. Usuário pode **rolar para baixo** em cada coluna independentemente
4. Ao gerar insumos, o **Textarea cresce** automaticamente para mostrar todo o conteúdo
5. Ao clicar "Próximo" → **Etapa 2 fica ativa** (coluna direita normal, coluna esquerda com opacity 50%)
6. Ao clicar "Voltar" → volta para Etapa 1 ativa

