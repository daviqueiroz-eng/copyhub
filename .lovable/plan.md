

## Plano: Layout Horizontal para Popovers e Dialogs de Seleção

### Resumo

Alterar o layout do popover de seleção de cor e dos dialogs de "Conteúdo Notável" e "7 Gatilhos" para exibir o **texto selecionado à esquerda** e as **opções à direita**, em formato lado a lado.

---

### Problema Atual

O popover e os dialogs estão com layout vertical:

```text
+------------------------+
| Texto selecionado      |
| "(texto aqui...)"      |
+------------------------+
| Qual elemento é?       |
| ■ Desejo               |
| ■ Headline             |
| ■ ...                  |
+------------------------+
```

### Layout Desejado

Layout horizontal com texto à esquerda e opções à direita:

```text
+-------------------+-------------------+
| Texto selecionado | Qual elemento é?  |
| "(texto aqui...)" | ■ Desejo          |
|                   | ■ Headline        |
|                   | ■ Conteúdo notável|
|                   | ■ ...             |
+-------------------+-------------------+
```

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/AnaliseRoteiroGame.tsx` | Alterar layout dos 3 elementos para horizontal |

---

### Detalhes Técnicos

#### 1. Popover de Seleção de Cor (linhas 2118-2175)

**Antes:**
```tsx
<div className="fixed z-50 ... min-w-[300px]">
  <div className="mb-4">
    <h4>Texto selecionado</h4>
    <p>{texto}</p>
  </div>
  <div>
    <h4>Qual elemento é?</h4>
    <div>{cores.map(...)}</div>
  </div>
</div>
```

**Depois:**
```tsx
<div className="fixed z-50 ... min-w-[500px]">
  <div className="flex gap-4">
    {/* Coluna Esquerda - Texto */}
    <div className="flex-1 border-r pr-4">
      <h4>Texto selecionado</h4>
      <p className="max-h-[250px] overflow-y-auto">{texto}</p>
    </div>
    
    {/* Coluna Direita - Opções */}
    <div className="flex-1">
      <h4>Qual elemento é?</h4>
      <div>{cores.map(...)}</div>
    </div>
  </div>
  <div className="mt-3 pt-3 border-t">
    <Button>Cancelar</Button>
  </div>
</div>
```

#### 2. Dialog de Conteúdo Notável (linhas 2522-2587)

**Antes:**
```tsx
<DialogContent>
  <DialogHeader>
    <DialogTitle>Qual o conteúdo notável?</DialogTitle>
  </DialogHeader>
  <div className="space-y-3">
    {estruturas.map(...)}
  </div>
</DialogContent>
```

**Depois:**
```tsx
<DialogContent className="max-w-[600px]">
  <DialogHeader>
    <DialogTitle>Qual o conteúdo notável?</DialogTitle>
  </DialogHeader>
  <div className="flex gap-4">
    {/* Coluna Esquerda - Texto selecionado */}
    <div className="flex-1 border-r pr-4">
      <h4 className="text-sm font-medium mb-2">Texto selecionado</h4>
      <p className="text-sm bg-muted p-2 rounded max-h-[200px] overflow-y-auto">
        {highlightPendenteEstrutura?.text || ""}
      </p>
    </div>
    
    {/* Coluna Direita - Opções */}
    <div className="flex-1 space-y-3">
      {estruturas.map((estrutura) => (
        <Checkbox ... />
      ))}
    </div>
  </div>
</DialogContent>
```

#### 3. Dialog de 7 Gatilhos (linhas 2589-2655)

Mesma estrutura do Conteúdo Notável:

```tsx
<DialogContent className="max-w-[600px]">
  <DialogHeader>
    <DialogTitle>Quais gatilhos estão presentes?</DialogTitle>
  </DialogHeader>
  <div className="flex gap-4">
    {/* Coluna Esquerda - Texto selecionado */}
    <div className="flex-1 border-r pr-4">
      <h4 className="text-sm font-medium mb-2">Texto selecionado</h4>
      <p className="text-sm bg-muted p-2 rounded max-h-[200px] overflow-y-auto">
        {highlightPendenteGatilhos?.text || ""}
      </p>
    </div>
    
    {/* Coluna Direita - Opções */}
    <div className="flex-1 space-y-3">
      {gatilhos.map(...)}
    </div>
  </div>
</DialogContent>
```

---

### Visual Final

#### Popover de Seleção de Cor
```text
+--------------------------------------------+
| Texto selecionado    | Qual elemento é?    |
| "(0:00) Hoje eu vou  | ■ Desejo            |
| te mostrar 5 formas  | ■ Headline          |
| de ganhar dinheiro   | ■ Intensificador    |
| online sem..."       | ■ Conteúdo notável  |
|                      | ■ Apresentação mag. |
|                      | ■ CTA               |
|                      | ■ Reconhecimento    |
|                      | ■ Prova             |
|                      | ■ 7 Gatilhos        |
+--------------------------------------------+
|              [Cancelar]                    |
+--------------------------------------------+
```

#### Dialog Conteúdo Notável / 7 Gatilhos
```text
+------------------------------------------------+
|        Qual o conteúdo notável?                |
|    (selecione todas as opções que se aplicam)  |
+------------------------+-----------------------+
| Texto selecionado      | [ ] Valor prático     |
| "(texto do roteiro     | [ ] História          |
| que foi selecionado    | [ ] Prova/argumentação|
| pelo usuário...)"      | [ ] Ponto de identif. |
|                        | [ ] Opinião polêmica  |
|                        | [ ] Fatos curiosos    |
+------------------------+-----------------------+
|                   [Cancelar] [Confirmar]       |
+------------------------------------------------+
```

---

### Benefícios

1. **Contexto visível**: O texto selecionado fica sempre visível enquanto escolhe a opção
2. **Melhor uso do espaço**: Layout horizontal aproveita melhor a largura da tela
3. **Consistência**: Todos os 3 elementos (popover, dialog estrutura, dialog gatilhos) seguem o mesmo padrão
4. **UX melhorada**: Usuário não precisa rolar para ver as opções

