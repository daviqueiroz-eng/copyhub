

## Plano: Espaçamento no Colar + Fundo Vermelho acima de 2100 caracteres

### Mudanca 1: Normalizar texto colado (paragrafos com espacamento)

Quando o usuario cola texto no campo de estrutura, o texto vem sem quebras de linha adequadas. Adicionar um handler `onPaste` no `InlineSpellCheckEditor` que:
- Intercepta o paste
- Pega o texto do clipboard
- Adiciona uma linha em branco entre paragrafos (detecta pontos finais seguidos de letra maiuscula como quebra de paragrafo)
- Insere o texto processado na posicao do cursor

**Logica**: Regex para detectar padrao `. [A-Z]` ou `.\n[A-Z]` e substituir por `.\n\n` para criar paragrafos visuais.

### Mudanca 2: Fundo vermelho quando estrutura > 2100 caracteres

No render do campo "ESTRUTURA" em `MentoradoRoteirosView.tsx`, adicionar uma classe condicional no container `<div>` que envolve a estrutura. Quando `roteiro.estrutura?.length > 2100`, aplicar fundo vermelho claro (similar a segunda imagem: `bg-red-100` / rosa claro).

---

### Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/mentorados/InlineSpellCheckEditor.tsx` | Adicionar prop `onPaste` e handler no textarea |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Passar `onPaste` no editor de estrutura para normalizar texto, adicionar classe de fundo vermelho condicional no container da estrutura quando > 2100 chars |

