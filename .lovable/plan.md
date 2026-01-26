

## Plano: Modo Revisão Clicável + Seleção de Texto Vinculada ao Chat

### Objetivo

Implementar duas melhorias:
1. Tornar o texto "Revisar" clicável para ativar o modo revisão
2. Ao selecionar texto no roteiro, vincular automaticamente ao chat para alterar apenas aquela parte

---

### Mudança 1: Label "Revisar" Clicável

#### Comportamento Atual
- O texto "Revisar" apenas marca/desmarca o checkbox
- Para abrir o modo revisão, precisa clicar no ícone de Play

#### Novo Comportamento
- Clicar em "Revisar" abre diretamente o modo revisão
- O timer continua funcionando normalmente com os ícones
- O checkbox continua independente (pode marcar/desmarcar)

#### Mudanças no RoteiroChecklist.tsx

Alterar o Label do item "Revisar" para ser clicável e chamar `onRevisarPlay`:

```typescript
// No map de items, verificar se é o item "revisar"
{item.id === "revisar" ? (
  <span
    className={cn(
      "text-sm cursor-pointer leading-tight flex-1 hover:text-primary hover:underline",
      item.checked && "line-through text-muted-foreground"
    )}
    onClick={() => onRevisarPlay?.()}
  >
    {item.label}
  </span>
) : (
  <Label
    htmlFor={item.id}
    className={cn(
      "text-sm cursor-pointer leading-tight flex-1",
      item.checked && "line-through text-muted-foreground"
    )}
  >
    {item.label}
  </Label>
)}
```

---

### Mudança 2: Seleção de Texto Vinculada ao Chat

#### Comportamento Atual
- Usuário edita diretamente no Textarea
- Para pedir alterações, digita no chat separadamente
- Não há conexão entre seleção e chat

#### Novo Comportamento
1. Usuário seleciona texto no roteiro
2. O texto selecionado é destacado visualmente
3. O input do chat mostra indicador do texto selecionado
4. Ao digitar, a instrução é aplicada apenas à parte selecionada
5. Prompt da IA recebe contexto específico da seleção

#### Mudanças no RoteiroRevisaoDialog.tsx

**Novos estados:**
```typescript
const [selectedText, setSelectedText] = useState<{
  text: string;
  field: "headline" | "estrutura";
  start: number;
  end: number;
} | null>(null);
```

**Capturar seleção dos Textareas:**
```typescript
const handleTextSelection = (field: "headline" | "estrutura") => {
  const selection = window.getSelection();
  const text = selection?.toString().trim();
  
  if (text && text.length > 0) {
    setSelectedText({
      text,
      field,
      start: /* posição início */,
      end: /* posição fim */
    });
    inputRef.current?.focus();
  }
};
```

**Indicador visual no input:**
```typescript
{selectedText && (
  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border-b text-xs">
    <span className="text-muted-foreground">Seleção:</span>
    <span className="font-medium text-amber-700 dark:text-amber-300 truncate max-w-[200px]">
      "{selectedText.text}"
    </span>
    <Button
      variant="ghost"
      size="icon"
      className="h-4 w-4 shrink-0"
      onClick={() => setSelectedText(null)}
    >
      <X className="h-3 w-3" />
    </Button>
  </div>
)}
```

**Enviar contexto para a IA:**
```typescript
const { data, error } = await supabase.functions.invoke("revisar-roteiro", {
  body: {
    headline: localHeadline,
    estrutura: localEstrutura,
    mensagem: userMessage.content,
    historico,
    // Novo campo para seleção
    selecao: selectedText ? {
      texto: selectedText.text,
      campo: selectedText.field,
    } : null,
  },
});
```

#### Mudanças na Edge Function revisar-roteiro

Atualizar o prompt para considerar a seleção:

```typescript
// Se há seleção, adicionar instrução específica
if (selecao) {
  systemPrompt += `\n\nATENÇÃO: O usuário selecionou este trecho específico do campo "${selecao.campo}":
"${selecao.texto}"

A instrução do usuário se refere APENAS a este trecho selecionado. 
Altere SOMENTE esta parte, mantendo todo o resto do texto idêntico.`;
}
```

---

### Interface com Seleção Ativa

```text
+--------------------------------------------+-----------------------------+
|  HEADLINE 01:                              |  Chat de Revisão            |
|  [Texto da headline aqui...]               |                             |
|                                            |  +------------------------+ |
|  ESTRUTURA 01:                             |  | Seleção: "demais"  [x] | |
|  [                                         |  +------------------------+ |
|   Texto com a palavra [demais] destacada   |                             |
|   em amarelo mostrando que está            |  [________________] [Enviar]|
|   selecionada pelo usuário                 |                             |
|  ]                                         |  Ao digitar "muito bom"     |
|                                            |  a IA troca só essa palavra |
+--------------------------------------------+-----------------------------+
```

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/mentorados/RoteiroChecklist.tsx` | Tornar label "Revisar" clicável para abrir o modo |
| `src/components/mentorados/RoteiroRevisaoDialog.tsx` | Adicionar captura de seleção e indicador visual |
| `supabase/functions/revisar-roteiro/index.ts` | Processar campo `selecao` no prompt |

---

### Fluxo de Uso Atualizado

1. Usuário clica em "Revisar" no checklist
2. Modo revisão abre em tela cheia
3. Usuário lê o roteiro e seleciona "demais" com o mouse
4. Indicador aparece: `Seleção: "demais" [x]`
5. Usuário digita: "muito bom"
6. IA entende: "trocar 'demais' por 'muito bom'"
7. Apenas essa palavra é alterada no texto
8. Seleção é limpa automaticamente

---

### Detalhes Técnicos

**Captura de seleção:**
- Usar eventos `onMouseUp` e `onSelect` nos Textareas
- Guardar posição (start/end) para highlight futuro
- Limpar seleção após aplicar mudança

**Prompt otimizado para seleção:**
```text
O usuário selecionou: "demais"
No campo: estrutura
Instrução: "muito bom"

Ação: Substituir "demais" por "muito bom" mantendo todo o resto idêntico.
```

