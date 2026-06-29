## Objetivo
Deixar a tela de Roteiros (`MentoradoRoteirosView`) com cara mais próxima do Google Docs (referência: imagem 3), sem perder nenhuma funcionalidade — apenas reorganizando/escondendo elementos no header e ajustando a sidebar esquerda.

## Mudanças no Header (topo)

Arquivo: `src/components/mentorados/MentoradoRoteirosView.tsx`

1. **Remover do topo:**
   - Logo/marca "Copy Hub" (caso esteja sendo renderizada via layout pai do `Mentorados.tsx` quando a view de roteiros está aberta — verificar e ocultar enquanto a view estiver ativa).
   - Componente `<TopClockWidget />` (Pomodoro/Cronômetro centralizado no header — linhas ~2660–2665).
   - Botão de atalhos de teclado / seção "Atalhos" da sidebar esquerda (linhas ~2888–2890).

2. **Manter exatamente como na imagem 3:**
   - Botão `X` (voltar), título "Roteiros - {nome}" e subtítulo "Guia X • Y/Z preenchidas".
   - Ícone "Salvo agora" (status de salvamento) ao lado do título.
   - Botões do topo direito: **Visualizar outro mentorado**, **Subir em massa**, **Copiar todos**, **Compartilhar mentorado**.
   - Indicadores **Headlines: 15/15** e **Roteiros: 15/15** no canto superior direito da toolbar (mover o `RoteiroProgressBar` da linha ~2669 para dentro da barra de ferramentas de formatação, alinhado à direita, como na imagem 3). Também manter o "100%" de zoom à direita deles.

3. **Toolbar de formatação** (linha abaixo do header):
   - Manter Undo/Redo, Texto normal, Poppins, tamanho de fonte, B/I/U, cor, link, alinhamento, listas, indentação, menu "..." — exatamente como já está hoje.

## Mudanças na Sidebar Esquerda

Deixar mais "Google Docs":
- Manter a lista de **Guias** com drag-and-drop, contador X/Y, olho de visibilidade e botão "+ Nova Guia" no rodapé (já existe — só ajustar visual).
- Manter o accordion **Perfil**.
- Estilo: fundo branco/discreto, tipografia menor, item ativo com pill azul-claro (como Docs), ícone de "guias" pequeno ao lado do título "Guias no documento".
- **Remover** a seção "Atalhos" (linhas ~2888+) e o botão "Compartilhar mentorado" do topo da sidebar (movido para o header, item já listado acima).

## O que NÃO muda
- Toda a lógica de edição, salvamento, realtime, comentários, votações, corretor, find/replace, headlines visualização, share, bulk upload, copy all permanece intacta.
- Atalhos de teclado (Ctrl+Z, Ctrl+H, Tab para trocar mentorado, comandos `/`) continuam funcionando — só o **ícone visual** de atalhos sai do header.
- Pomodoro continua acessível pelo sistema global (`PomodoroContext`) — só o widget no header da view de Roteiros some.

## Detalhes técnicos
- Mover `<RoteiroProgressBar />` para dentro do mesmo flex da toolbar de formatação, com `ml-auto` para ficar à direita.
- Ajustar paddings do header (`py-4` → `py-2`) para deixar mais compacto como Docs.
- Sidebar: trocar `bg-muted/30` por `bg-background`, items ativos com `bg-blue-50 text-blue-700` (tokenizado via classe semântica).
