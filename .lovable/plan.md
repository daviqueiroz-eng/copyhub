## Concluído: Remover Legenda e Adicionar Popover de Seleção de Cores

### Status: ✅ Implementado

### Mudanças Realizadas

1. **Removida a coluna esquerda de "Legenda"** do layout de análise
2. **Layout alterado de 3 para 2 colunas** (`lg:grid-cols-2`)
3. **Popover flutuante implementado** que aparece ao selecionar texto
4. **Botões Desfazer/Limpar** movidos para uma barra de ferramentas compacta acima do conteúdo
5. **Lista de Palavras Grifadas** movida para abaixo do conteúdo do roteiro

### Comportamento do Popover

1. Usuário seleciona texto no roteiro
2. Popover aparece próximo à seleção mostrando:
   - Trecho do texto selecionado
   - Lista de cores/elementos disponíveis
3. Usuário clica na cor desejada
4. Highlight é aplicado e popover fecha
5. Lógica especial para "Conteúdo Notável" mantida (abre dialog de estrutura)

### Layout Final

```text
+------------------------+------------------+
| Barra de Ferramentas   |                  |
| (Desfazer, Limpar)     |                  |
+------------------------+                  |
| Conteúdo do Roteiro    | Campos de        |
| (popover ao selecionar)| Análise          |
+------------------------+                  |
| Lista de Grifadas      |                  |
+------------------------+------------------+
```
