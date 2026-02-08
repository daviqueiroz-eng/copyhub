

## Plano: Aumentar tamanho dos cards no carrossel Tab

### Resumo

Aumentar o tamanho dos cards (foto/iniciais e nome) no carrossel de mentorados ativado pela tecla Tab, para ficar mais parecido com o estilo Xbox (cards grandes e destacados).

### Arquivo a Modificar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Aumentar dimensoes dos cards no carrossel |

### Mudancas (linhas 3117-3138)

- Foto/iniciais: de `w-16 h-16` (64px) para `w-24 h-24` (96px)
- Texto das iniciais: de `text-lg` para `text-2xl`
- Nome: de `text-xs` e `max-w-[80px]` para `text-sm` e `max-w-[100px]`
- Padding do botao: de `p-3` para `p-4`
- Gap entre foto e nome: de `gap-2` para `gap-3`
- Card selecionado com scale maior: `scale-110` ao inves de `scale-105`

### Resultado

Cards visivelmente maiores, com fotos de ~96px de diametro (similar ao tamanho da foto de referencia), nomes mais legiveis e espacamento proporcional.

