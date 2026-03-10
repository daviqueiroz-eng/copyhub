

## Plano: Disparo de Webhook no Blur + Opcao "Configurar" no Dropdown

### Problema Atual
- O webhook de deteccao de tipo dispara via debounce (2s apos digitar), mas o usuario quer que dispare **ao sair do campo headline** (blur)
- Nao existe opcao "configurar" no dropdown de tipos, conforme mostrado na imagem 1
- O dialog de configuracao ja existe (`TipoRoteiroConfigDialog`) e ja tem o layout correto (prompt + template)

---

### Mudancas

#### 1. Disparar webhook no blur do headline (MentoradoRoteirosView.tsx)

- Modificar `handleFieldBlur`: quando `field === "headline"` e a headline tem conteudo (>10 chars), chamar imediatamente a deteccao via webhook (sem debounce)
- Remover o `useEffect` que monitora mudancas de headline para trigger automatico (linhas 1397-1414) — nao faz mais sentido com blur
- Remover o debounce de 2s no `triggerTipoDetection` — a chamada sera direta, sem `setTimeout`
- Manter o `manualTipoChangeRef` como bloqueio: se o usuario escolheu manualmente, nao sobrescrever

#### 2. Adicionar "configurar" no dropdown de tipo (MentoradoRoteirosView.tsx)

- Adicionar um item "configurar" no final do `SelectContent` do dropdown de tipos (linhas 2583-2589)
- Quando clicado, abrir o `TipoRoteiroConfigDialog` com o tipo atualmente selecionado
- Se nenhum tipo estiver selecionado, a opcao "configurar" abrira o primeiro tipo disponivel (ou nao aparecera)
- Importar `TipoRoteiroConfigDialog` e adicionar state para controlar sua abertura

#### 3. Nenhuma mudanca no dialog de configuracao

O `TipoRoteiroConfigDialog` ja tem o layout correto conforme a segunda imagem:
- Campo "Prompt / Instrucoes para IA" (textarea grande)
- Campo "Template de Estrutura (opcional)" (textarea menor)
- Botoes Cancelar e Salvar

---

### Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Mover trigger para `handleFieldBlur`, remover useEffect de auto-detect, adicionar opcao "configurar" no Select, importar TipoRoteiroConfigDialog |

### Fluxo do Usuario

1. Digita a headline "3 livros para ler"
2. Clica fora do campo (blur)
3. Bolinha de loading aparece ao lado do dropdown "Tipo..."
4. Webhook n8n retorna `{ tipo: "Lista util" }`
5. Sistema encontra match com tipo cadastrado e preenche automaticamente
6. Para configurar o prompt de um tipo, abre o dropdown e clica em "configurar"
7. Dialog abre com campos de Prompt e Template para editar
