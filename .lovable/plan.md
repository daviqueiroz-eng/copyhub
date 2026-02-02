

## Plano: Melhorar Layout de Grifadas e Adicionar "7 Gatilhos"

### Resumo

Implementar 3 melhorias na interface de analise:
1. Mudar layout das palavras grifadas de vertical para horizontal
2. Criar nova categoria "7 Gatilhos" com multi-selecao
3. Permitir multi-selecao no dialog de "Conteudo Notavel"

---

### 1. Layout Horizontal para Palavras Grifadas

**Atual:** Cards empilhados verticalmente
**Novo:** Cards em linha horizontal (wrap quando necessario)

```text
ATUAL:                          NOVO:
+------------------------+      +----------+ +----------+ +----------+
| "Palavra 1..."         |      |Palavra 1 | |Palavra 2 | |Palavra 3 |
+------------------------+      +----------+ +----------+ +----------+
| "Palavra 2..."         |      +----------+ +----------+
+------------------------+      |Palavra 4 | |Palavra 5 |
| "Palavra 3..."         |      +----------+ +----------+
+------------------------+
```

**Arquivo:** `src/components/HighlightsList.tsx`

**Mudancas:**
- Trocar `space-y-2` por `flex flex-wrap gap-2`
- Cards menores: remover padding extra e diminuir tamanho
- Tooltip no hover para mostrar texto completo
- Manter botao de excluir no hover

---

### 2. Nova Categoria "7 Gatilhos" com Multi-Selecao

**Comportamento:**
1. Usuario seleciona texto
2. Popover aparece com lista de cores
3. Se clicar em "7 Gatilhos", abre um dialog de multi-selecao
4. Pode marcar varias opcoes (checkboxes)
5. Confirma e o highlight e salvo com as opcoes selecionadas

**Opcoes do "7 Gatilhos":**
- Recompensa
- Misterio
- Reconhecimento
- Popularidade/Autoridade
- Crenca
- Disrupcao
- Atencao imediata

**Requisito:** A categoria "7 Gatilhos" precisa existir na tabela `cores_analise` do banco de dados (pode ser criada pelo admin no painel de cores).

**Arquivo:** `src/pages/AnaliseRoteiroGame.tsx`

**Novos estados:**
```typescript
const [showGatilhosDialog, setShowGatilhosDialog] = useState(false);
const [gatilhosSelecionados, setGatilhosSelecionados] = useState<string[]>([]);
const [highlightPendenteGatilhos, setHighlightPendenteGatilhos] = useState<Highlight | null>(null);
```

**Novo dialog:**
```text
+------------------------------------------+
| Quais gatilhos estao presentes?          |
+------------------------------------------+
| [ ] Recompensa                           |
| [ ] Misterio                             |
| [ ] Reconhecimento                       |
| [ ] Popularidade/Autoridade              |
| [ ] Crenca                               |
| [ ] Disrupcao                            |
| [ ] Atencao imediata                     |
|                                          |
| [Cancelar]               [Confirmar]     |
+------------------------------------------+
```

**Logica:**
- Na funcao `handleSelectColorFromPopover`, verificar se a cor clicada e "7 Gatilhos"
- Se for, abrir o dialog de multi-selecao ao inves de aplicar diretamente
- Ao confirmar, salvar as opcoes selecionadas em `annotations` do highlight

---

### 3. Multi-Selecao em "Conteudo Notavel"

**Atual:** So pode selecionar UMA estrutura
**Novo:** Pode selecionar VARIAS estruturas com checkboxes

**Arquivo:** `src/pages/AnaliseRoteiroGame.tsx`

**Mudancas no Dialog de Estrutura (linhas 2509-2560):**
- Trocar de botoes exclusivos para checkboxes
- Novo estado `estruturasSelecionadas: string[]` (array ao inves de string unica)
- Botao "Confirmar" salva array em `annotations`

**Layout atualizado:**
```text
+------------------------------------------+
| Qual o conteudo notavel?                 |
| (selecione todas que se aplicam)         |
+------------------------------------------+
| [x] Valor pratico                        |
| [ ] Historia                             |
| [x] Prova/ argumentacao                  |
| [ ] Ponto de identificacao               |
| [ ] Opiniao polemica                     |
| [ ] Fatos curiosos                       |
|                                          |
| [Cancelar]               [Confirmar]     |
+------------------------------------------+
```

---

### Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/HighlightsList.tsx` | Layout horizontal com flex-wrap |
| `src/pages/AnaliseRoteiroGame.tsx` | Novo dialog "7 Gatilhos" + multi-selecao em "Conteudo Notavel" |

---

### Detalhes Tecnicos

#### HighlightsList.tsx - Novo Layout

```tsx
// De:
<div className="space-y-2">

// Para:
<div className="flex flex-wrap gap-2">
  {filteredHighlights.map((highlight) => (
    <div
      key={highlight.id}
      className="group relative bg-card border rounded-lg px-2 py-1 hover:bg-accent transition-colors max-w-[200px]"
      title={highlight.text}  // Tooltip com texto completo
    >
      <button onClick={() => onHighlightClick(highlight.id)}>
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: highlight.color }}
          />
          <span className="text-xs truncate">
            {highlight.text.length > 30 
              ? `${highlight.text.slice(0, 30)}...` 
              : highlight.text}
          </span>
        </div>
      </button>
      {/* Botao delete no hover */}
    </div>
  ))}
</div>
```

#### Dialog "7 Gatilhos"

```tsx
<Dialog open={showGatilhosDialog} onOpenChange={setShowGatilhosDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Quais gatilhos estao presentes?</DialogTitle>
    </DialogHeader>
    <div className="space-y-3">
      {[
        "Recompensa",
        "Misterio", 
        "Reconhecimento",
        "Popularidade/Autoridade",
        "Crenca",
        "Disrupcao",
        "Atencao imediata"
      ].map((gatilho) => (
        <div key={gatilho} className="flex items-center space-x-2">
          <Checkbox
            checked={gatilhosSelecionados.includes(gatilho)}
            onCheckedChange={(checked) => {
              if (checked) {
                setGatilhosSelecionados([...gatilhosSelecionados, gatilho]);
              } else {
                setGatilhosSelecionados(gatilhosSelecionados.filter(g => g !== gatilho));
              }
            }}
          />
          <label>{gatilho}</label>
        </div>
      ))}
    </div>
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={() => /* cancelar */}>
        Cancelar
      </Button>
      <Button onClick={() => /* confirmar e salvar */} disabled={gatilhosSelecionados.length === 0}>
        Confirmar
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

#### Multi-Selecao "Conteudo Notavel"

```tsx
// Novo estado (trocar de string para array)
const [estruturasSelecionadas, setEstruturasSelecionadas] = useState<string[]>([]);

// No dialog, trocar Button por Checkbox
{["Valor pratico", "Historia", ...].map((estrutura) => (
  <div key={estrutura} className="flex items-center space-x-2">
    <Checkbox
      checked={estruturasSelecionadas.includes(estrutura)}
      onCheckedChange={(checked) => {
        if (checked) {
          setEstruturasSelecionadas([...estruturasSelecionadas, estrutura]);
        } else {
          setEstruturasSelecionadas(estruturasSelecionadas.filter(e => e !== estrutura));
        }
      }}
    />
    <label>{estrutura}</label>
  </div>
))}
```

---

### Fluxo de Uso

**Selecionar "7 Gatilhos":**
1. Usuario seleciona texto no roteiro
2. Popover aparece com lista de cores
3. Clica em "7 Gatilhos"
4. Dialog abre com checkboxes
5. Marca: Misterio, Reconhecimento
6. Clica "Confirmar"
7. Highlight e criado com annotation: "Misterio, Reconhecimento"

**Selecionar "Conteudo Notavel":**
1. Usuario seleciona texto
2. Clica em "Conteudo Notavel" no popover
3. Dialog abre com checkboxes
4. Marca: Valor pratico, Prova/argumentacao
5. Clica "Confirmar"
6. Highlight e criado com annotations: ["Valor pratico", "Prova/ argumentacao"]

---

### Exibicao das Anotacoes

Na lista de palavras grifadas e no tooltip, mostrar as anotacoes selecionadas:

```text
+----------+
|Texto abc |
|[Valor]   |
|[Prova]   |
+----------+
```

Ou em formato de badges pequenas abaixo do texto grifado.

