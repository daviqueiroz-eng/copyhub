
## Plano: Remover Chat Inline e Adicionar Dialogo de Edicao por Selecao

### Visao Geral

Remover o componente `RoteiroInlineChat` (com historico de conversa) e implementar um novo sistema estilo "analise de roteiro": quando o usuario seleciona texto na estrutura, abre um dialogo compacto onde ele pode digitar uma instrucao. A IA modifica APENAS o trecho selecionado.

---

### Layout do Dialogo de Selecao

```text
+--------------------------------------------------+
|  TEXTO SELECIONADO:                              |
|  "primeiro seu gosto por comida muda de verdade" |
+--------------------------------------------------+
| +------------------------------------------+     |
| | O que deseja fazer com este trecho?      |     |
| +------------------------------------------+     |
|                                                  |
| [+]                    [Tipo de Chat v] [Enviar] |
+--------------------------------------------------+
```

O dialogo aparece quando:
- Usuario seleciona texto (mouseup ou touchend) no campo estrutura
- Ha texto selecionado (selectionStart != selectionEnd)

---

### Arquivos a Modificar

| Arquivo | Mudancas |
|---------|----------|
| `src/components/mentorados/RoteiroInlineChat.tsx` | **DELETAR** - Nao sera mais usado |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Remover import e uso do RoteiroInlineChat, adicionar logica de selecao |
| `src/components/mentorados/SelectionEditDialog.tsx` | **NOVO** - Dialogo para editar trecho selecionado |

---

### Detalhes Tecnicos

#### 1. Novo Componente: SelectionEditDialog.tsx

Dialogo que aparece ao selecionar texto:

```tsx
interface SelectionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedText: string;
  campo: "headline" | "estrutura";
  headline: string;
  estrutura: string;
  onUpdate: (headline: string, estrutura: string) => void;
}
```

**Caracteristicas:**
- Mostra o texto selecionado em destaque (fundo colorido)
- Input para digitar instrucao
- Botao "+" para tipos de ajuste (reaproveitar logica do TiposAjuste)
- Seletor de tipo de chat (reaproveitar useTiposChatRevisao)
- Botao enviar que chama `revisar-roteiro` com parametro `selecao`
- Loading state durante processamento
- Fecha automaticamente apos sucesso

#### 2. Logica de Deteccao de Selecao

Adicionar ao `InlineSpellCheckEditor` ou diretamente no `MentoradoRoteirosView`:

```tsx
// Estado para armazenar selecao
const [selectionData, setSelectionData] = useState<{
  text: string;
  campo: "headline" | "estrutura";
  roteiroKey: string;
  startIndex: number;
  endIndex: number;
} | null>(null);

// Handler para detectar selecao de texto
const handleTextSelection = useCallback((
  e: React.SyntheticEvent<HTMLTextAreaElement>,
  key: string,
  campo: "headline" | "estrutura"
) => {
  const target = e.currentTarget;
  const start = target.selectionStart;
  const end = target.selectionEnd;
  
  if (start !== end && end - start > 0) {
    const selectedText = target.value.substring(start, end);
    setSelectionData({
      text: selectedText,
      campo,
      roteiroKey: key,
      startIndex: start,
      endIndex: end,
    });
  }
}, []);
```

#### 3. Chamada da Edge Function

O dialogo chama `revisar-roteiro` com o parametro `selecao`:

```typescript
const payload = {
  headline,
  estrutura,
  mensagem: inputValue,
  historico: [],
  selecao: {
    texto: selectedText,
    campo: campo,
  },
  promptSistema: selectedTipoChat?.prompt_sistema || null,
};

const { data, error } = await supabase.functions.invoke("revisar-roteiro", {
  body: payload,
});
```

A edge function ja suporta isso (linhas 55-63 do `revisar-roteiro/index.ts`):
```typescript
if (selecao && selecao.texto) {
  roteiroContext += `
ATENCAO: O usuario selecionou este trecho especifico do campo "${selecao.campo}":
"${selecao.texto}"
A instrucao do usuario se refere APENAS a este trecho selecionado.
Altere SOMENTE esta parte, mantendo todo o resto do texto IDENTICO.`;
}
```

#### 4. Remocao do RoteiroInlineChat

No `MentoradoRoteirosView.tsx`:

```diff
- import { RoteiroInlineChat } from "./RoteiroInlineChat";

// ... dentro do render de cada roteiro ...

- {/* Chat inline - aparece se estrutura tem conteudo */}
- {roteiro.estrutura?.trim() && (
-   <RoteiroInlineChat
-     roteiroKey={key}
-     headline={roteiro.headline}
-     estrutura={roteiro.estrutura}
-     onUpdate={(h, e) => {
-       handleChange(guiaAtiva, ordem, "headline", h);
-       handleChange(guiaAtiva, ordem, "estrutura", e);
-     }}
-   />
- )}
```

---

### Design do SelectionEditDialog

Layout compacto e focado:

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="text-sm font-medium">
        Editar selecao
      </DialogTitle>
    </DialogHeader>
    
    {/* Texto selecionado */}
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
      <p className="text-xs text-muted-foreground mb-1">Texto selecionado:</p>
      <p className="text-sm font-medium">"{selectedText}"</p>
    </div>
    
    {/* Input para instrucao */}
    <Textarea
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      placeholder="O que deseja fazer com este trecho?"
      className="min-h-[80px]"
      disabled={isProcessing}
    />
    
    {/* Linha de acoes */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            {/* Lista de tipos de ajuste */}
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs">
              {selectedTipoChat?.nome || "Padrao"}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            {/* Seletor de tipo de chat */}
          </PopoverContent>
        </Popover>
        
        <Button onClick={handleSend} disabled={isProcessing || !inputValue.trim()}>
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

---

### Fluxo de Uso

1. Usuario esta editando a estrutura do roteiro
2. Seleciona um trecho de texto com o mouse/teclado
3. Dialogo `SelectionEditDialog` abre automaticamente
4. Usuario ve o texto selecionado destacado
5. Digita a instrucao (ex: "deixe mais informal")
6. Clica em Enviar
7. IA modifica apenas o trecho selecionado
8. Dialogo fecha e o roteiro e atualizado
9. Historico nao e mantido - cada selecao e uma interacao unica

---

### Trigger de Selecao

Para abrir o dialogo ao selecionar texto, usar `onMouseUp` no textarea:

```tsx
<InlineSpellCheckEditor
  // ... props existentes
  onMouseUp={(e) => {
    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    
    if (start !== end) {
      const text = target.value.substring(start, end);
      if (text.trim().length > 0) {
        setSelectionData({
          text: text,
          campo: "estrutura",
          roteiroKey: key,
          startIndex: start,
          endIndex: end,
          headline: roteiro.headline,
          estrutura: roteiro.estrutura,
        });
        setShowSelectionDialog(true);
      }
    }
  }}
/>
```

**Nota:** Pode ser necessario adicionar prop `onMouseUp` ao `InlineSpellCheckEditor`.

---

### Consideracoes

- Nao ha historico de conversa - cada selecao e uma edicao unica
- O dialogo fecha apos aplicar a alteracao
- Usuario pode cancelar fechando o dialogo
- Se o usuario clicar fora sem enviar, a selecao e descartada
- Funciona tanto para headline quanto para estrutura
