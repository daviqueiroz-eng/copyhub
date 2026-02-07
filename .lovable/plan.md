

## Plano: Mover botão de cópia para ao lado do Select de tipo

### Resumo

Mover o botão `ClipboardCopy` (copiar headline + estrutura) da barra de ferramentas lateral (abaixo do teleprompter) para ao lado do dropdown de seleção de tipo de estrutura, na mesma linha do "HEADLINE 01:".

### Arquivo a Modificar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Mover botão de posição |

### Mudanças

**1. Remover o botão da toolbar lateral (linhas ~2417-2428):**

Remover o bloco condicional `{roteiro.tipo_roteiro_id && (...ClipboardCopy...)}` da div da toolbar flutuante.

**2. Adicionar o botão ao lado do Select de tipo (linha ~2483, após o fechamento do `</Select>`):**

```tsx
<Select ...>
  {/* ... conteúdo existente ... */}
</Select>

{/* Botao de copia simplificada - ao lado do select */}
{roteiro.tipo_roteiro_id && (
  <Button
    variant="ghost"
    size="icon"
    className="h-6 w-6"
    title="Copiar headline + estrutura do tipo"
    onClick={() => handleCopyRoteiroSimplificado(guiaAtiva, ordem)}
  >
    <ClipboardCopy className="h-3.5 w-3.5" />
  </Button>
)}
```

### Resultado Visual

```text
Antes:
  HEADLINE 01:  [Lista util v]
  ...
                                    [toolbar: copy|delete|tts|speak|video|clipboardcopy]

Depois:
  HEADLINE 01:  [Lista util v]  [clipboardcopy]
  ...
                                    [toolbar: copy|delete|tts|speak|video]
```

O botão fica compacto (h-6 w-6) para combinar com o tamanho do Select (h-6), aparecendo somente quando um tipo estiver selecionado.
