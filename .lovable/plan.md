

## Plano: Remover Legenda e Adicionar Popover de Seleção de Cores

### Resumo

Remover a seção "Legenda" fixa do lado esquerdo e, ao invés disso, exibir um popover flutuante com as opções de cores sempre que o usuário selecionar texto no roteiro. O layout mudará de 3 colunas para 2 colunas.

---

### O que será feito

1. **Remover a coluna esquerda** que contém a Legenda de Cores
2. **Criar um popover** que aparece próximo ao texto selecionado
3. **Mudar o grid** de 3 colunas para 2 colunas
4. **Manter a lista de "Palavras Grifadas"** em outro local (junto com os botões Desfazer/Limpar)

---

### Layout Atual vs Novo

```text
ATUAL (3 colunas):
+----------------+------------------+------------------+
| Legenda        | Conteúdo Roteiro | Análise          |
| (cores)        |                  | (campos)         |
| Palavras       |                  |                  |
| Grifadas       |                  |                  |
+----------------+------------------+------------------+

NOVO (2 colunas):
+------------------------+------------------+
| Conteúdo Roteiro       | Análise          |
| (ao selecionar texto,  | (campos)         |
|  popover aparece)      |                  |
+------------------------+------------------+
```

---

### Comportamento do Popover

1. Usuário seleciona texto no roteiro
2. Popover aparece mostrando:
   - **"Texto selecionado"**: exibe o trecho selecionado
   - **"Qual elemento é?"**: lista de cores para escolher
3. Usuário clica na cor desejada
4. Highlight é aplicado e popover fecha

```text
+------------------------------------------+
| Texto selecionado                        |
| "(0:00) Hoje eu vou te mostrar 5..."     |
|                                          |
|              Qual elemento é?            |
|    +--------------------------------+    |
|    | ■ Headline                     |    |
|    | ■ Intensificador do mistério   |    |
|    | ■ Conteúdo notável             |    |
|    | ■ Apresentação magnética       |    |
|    | ■ CTA                          |    |
|    | ■ Reconhecimento               |    |
|    | ■ Prova                        |    |
|    +--------------------------------+    |
+------------------------------------------+
```

---

### Arquivo a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/AnaliseRoteiroGame.tsx` | Remover legenda, adicionar popover, ajustar layout |

---

### Detalhes Técnicos

#### 1. Novos Estados

```typescript
// Estados para popover de seleção
const [showColorPopover, setShowColorPopover] = useState(false);
const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
const [pendingSelection, setPendingSelection] = useState<{
  text: string;
  startPos: number;
  endPos: number;
} | null>(null);
```

#### 2. Nova função handleTextSelection

Ao invés de aplicar o highlight direto, vai:
1. Capturar a seleção
2. Calcular posição para o popover
3. Armazenar seleção pendente
4. Mostrar popover

```typescript
const handleTextSelection = () => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  if (!currentRoteiro) return;

  // Calcular posições...
  const selectedText = currentRoteiro.conteudo.slice(startPos, endPos);
  if (!selectedText.trim()) return;

  // Calcular posição do popover (próximo à seleção)
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  setPopoverPosition({
    x: rect.left + rect.width / 2,
    y: rect.top - 10
  });
  
  setPendingSelection({ text: selectedText, startPos, endPos });
  setShowColorPopover(true);
};
```

#### 3. Nova função para aplicar cor selecionada

```typescript
const handleSelectColor = (color: string) => {
  if (!pendingSelection) return;
  
  // Verificar duplicatas/sobreposição...
  
  const newHighlight: Highlight = {
    id: crypto.randomUUID(),
    text: pendingSelection.text,
    color: color,
    startPos: pendingSelection.startPos,
    endPos: pendingSelection.endPos,
  };
  
  // Lógica especial para "Conteúdo Notável"...
  
  setShowColorPopover(false);
  setPendingSelection(null);
  window.getSelection()?.removeAllRanges();
};
```

#### 4. Componente do Popover

```tsx
{showColorPopover && pendingSelection && (
  <div
    className="fixed z-50 bg-background border rounded-lg shadow-xl p-4 min-w-[300px]"
    style={{
      left: `${popoverPosition.x}px`,
      top: `${popoverPosition.y}px`,
      transform: 'translate(-50%, -100%)'
    }}
  >
    <div className="mb-4">
      <h4 className="text-sm font-medium text-muted-foreground mb-2">
        Texto selecionado
      </h4>
      <p className="text-sm bg-muted p-2 rounded max-h-20 overflow-y-auto">
        {pendingSelection.text.slice(0, 100)}...
      </p>
    </div>
    
    <div>
      <h4 className="text-lg font-semibold text-center mb-3 italic">
        Qual elemento é?
      </h4>
      <div className="space-y-2 border rounded-lg p-3">
        {cores.map((cor) => (
          <button
            key={cor.id}
            onClick={() => handleSelectColor(cor.cor)}
            className="w-full flex items-center gap-3 p-2 rounded hover:bg-accent transition-colors"
          >
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: cor.cor }}
            />
            <span className="text-sm">{cor.nome}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
)}
```

#### 5. Ajuste do Grid Layout

```tsx
// DE:
<div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_1fr] gap-6">

// PARA:
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
```

#### 6. Mover botões Desfazer/Limpar

Os botões "Desfazer" e "Limpar Tudo" serão movidos para a barra de ferramentas superior ou para um card menor no layout.

---

### Fluxo de Uso

1. Usuário está no modo de análise de roteiro
2. Seleciona um trecho de texto com o mouse
3. Popover aparece automaticamente acima/abaixo da seleção
4. Mostra o texto selecionado e lista de cores disponíveis
5. Usuário clica na cor desejada
6. Highlight é aplicado instantaneamente
7. Popover fecha

---

### Funcionalidades Mantidas

- Botão "Desfazer" (movido para header ou lateral)
- Botão "Limpar Tudo" (movido para header ou lateral)  
- Lista de "Palavras Grifadas" com filtro por cor
- Lógica especial para "Conteúdo Notável" (abre dialog de estrutura)
- Troca de cor ao selecionar palavra já grifada

