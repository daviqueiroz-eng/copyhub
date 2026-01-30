# Plano: Sistema de Edição por Seleção de Texto

## Status: ✅ Implementado

## Resumo

Substituído o sistema de chat inline (RoteiroInlineChat) por um sistema de edição por seleção de texto. Quando o usuário seleciona um trecho de texto no campo headline ou estrutura, um dialog compacto aparece permitindo solicitar alterações específicas para aquele trecho.

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/components/mentorados/RoteiroInlineChat.tsx` | **DELETADO** |
| `src/components/mentorados/SelectionEditDialog.tsx` | **CRIADO** - Dialog para editar trecho selecionado |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Removido RoteiroInlineChat, adicionado SelectionEditDialog e lógica de seleção |
| `src/components/mentorados/InlineSpellCheckEditor.tsx` | Adicionada prop `onMouseUp` |

## Fluxo de Uso

1. Usuário edita a headline ou estrutura do roteiro
2. Seleciona um trecho de texto com o mouse
3. Dialog `SelectionEditDialog` abre automaticamente
4. Usuário vê o texto selecionado destacado
5. Digita a instrução (ex: "deixe mais informal")
6. Clica em Enviar (ou Cmd/Ctrl + Enter)
7. IA modifica apenas o trecho selecionado
8. Dialog fecha e o roteiro é atualizado

## Funcionalidades do Dialog

- Mostra o texto selecionado em destaque
- Input para digitar instrução
- Botão "+" para tipos de ajuste predefinidos
- Seletor de perfil de chat (tipos_chat_revisao)
- Atalho Cmd/Ctrl + Enter para enviar
- Chama edge function `revisar-roteiro` com parâmetro `selecao`
