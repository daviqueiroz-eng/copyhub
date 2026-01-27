

## Plano: Ajustar Layout do Ajuste Fino para Estilo Claude

### Visao Geral

Reorganizar o layout do `AjusteFinoPanel` para que o campo de input tenha os botoes posicionados **abaixo** dele (em uma linha separada), nao ao lado, seguindo o design do Claude.

---

### Layout Desejado

```text
+--------------------------------------------------+
|                                                  |
|  [Conteudo das mensagens - ScrollArea]           |
|                                                  |
|  Texto das respostas e instrucoes aqui...        |
|                                                  |
|                                                  |
|                                                  |
|                                                  |
+--------------------------------------------------+
| +------------------------------------------+     |
| | Responder...                             |     |
| +------------------------------------------+     |
|                                                  |
| [+] [Clock]                   [Modelo v] [>]     |
|                                                  |
| IA pode cometer erros. Verifique as respostas.   |
+--------------------------------------------------+
```

---

### Mudancas no AjusteFinoPanel.tsx

#### Estrutura do Input (Antes)
```text
[ + ]  [ Textarea inline ]  [ > ]
```

#### Estrutura do Input (Depois)
```text
+--------------------------------+
| Responder...                   |
+--------------------------------+
[+] [clock]        [modelo] [>]
disclaimer
```

---

### Detalhes Tecnicos

1. **Separar o Textarea dos botoes**
   - Textarea ocupa largura total como um bloco
   - Linha de botoes abaixo do textarea

2. **Nova linha de botoes**
   - Esquerda: botao "+" (ajustes) + botao de historico/clock (opcional)
   - Direita: seletor de modelo (visual, nao funcional) + botao enviar

3. **Disclaimer embaixo**
   - Texto pequeno similar ao Claude: "IA pode cometer erros. Verifique as respostas."

---

### Arquivo a Modificar

| Arquivo | Mudancas |
|---------|----------|
| `src/components/mentorados/AjusteFinoPanel.tsx` | Reorganizar estrutura do input area para layout vertical |

---

### Codigo Proposto para Input Area

```tsx
{/* Input area */}
<div className="border-t shrink-0 bg-background p-4">
  {/* Indicador de selecao */}
  {selecao && (
    <div className="...">...</div>
  )}

  {/* Textarea - largura total */}
  <div className="bg-muted/30 rounded-xl border mb-2">
    <Textarea
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      placeholder="Responder..."
      className="min-h-[60px] max-h-[150px] border-0 bg-transparent ..."
    />
  </div>

  {/* Linha de botoes */}
  <div className="flex items-center justify-between">
    {/* Esquerda: + e clock */}
    <div className="flex items-center gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon">
            <Plus />
          </Button>
        </PopoverTrigger>
        ...
      </Popover>
      <Button variant="ghost" size="icon">
        <Clock />
      </Button>
    </div>

    {/* Direita: modelo e enviar */}
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" className="text-xs">
        Ajuste Fino
        <ChevronDown />
      </Button>
      <Button size="icon" onClick={handleEnviar}>
        <Send /> ou <ArrowUp />
      </Button>
    </div>
  </div>

  {/* Disclaimer */}
  <p className="text-[10px] text-center text-muted-foreground mt-3">
    IA pode cometer erros. Verifique as respostas.
  </p>
</div>
```

---

### Resultado Visual

- Campo de texto destacado e ocupando largura total
- Botoes organizados em linha separada abaixo
- Visual mais limpo e similar ao Claude
- Disclaimer centralizado na parte de baixo

