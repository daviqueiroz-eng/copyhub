

## Plano: Mobile Otimizado para Roteiros

### 1. Sincronização em tempo real entre dispositivos

Atualmente os roteiros salvam com debounce de 1500ms mas não há subscription realtime — o outro dispositivo só vê mudanças ao recarregar a página.

**Alterações:**
- Habilitar realtime na tabela `mentorados_roteiros` (migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.mentorados_roteiros`)
- Em `useMentoradosRoteiros.ts`, adicionar um `useEffect` com subscription realtime que invalida a query ao receber mudanças (`INSERT`, `UPDATE`, `DELETE`)
- Reduzir debounce de 1500ms para 800ms em `handleChange` no `MentoradoRoteirosView.tsx` para salvar mais rápido
- No `onSuccess` do `useUpsertMentoradoRoteiro`, **não** invalidar queries (já está assim) para evitar conflitos durante digitação — a subscription realtime cuidará de atualizar o outro dispositivo

### 2. Desativar alerta de cronômetro no mobile

No mobile, o alerta "ative o cronômetro" não deve aparecer.

**Alterações em `MentoradoRoteirosView.tsx`:**
- Na função `checkTimerAndAlert`, adicionar verificação `useIsMobile()` — se `isMobile` for true, retornar imediatamente sem mostrar alerta
- Importar `useIsMobile` do hook existente

### 3. UI mobile focada no texto (como na imagem)

No mobile, esconder toda a toolbar do header (undo/redo, buscar, corretor, copiar todos) e o mini-timer, deixando apenas o botão de fechar e o nome do mentorado. As funcionalidades extras ficam acessíveis pelo botão flutuante azul (que já existe como CheckSquare).

**Alterações em `MentoradoRoteirosView.tsx`:**

**Header mobile simplificado:**
- Esconder a barra de botões (undo/redo, buscar, corretor, copiar todos) no mobile com `hidden lg:flex`
- Esconder o mini-timer no mobile (já tem `lg:hidden` mas vamos removê-lo — não obrigar timer)
- Esconder a progress bar no mobile com `hidden lg:block`
- Manter: botão fechar (X) + nome do mentorado + indicador de guia

**Floating button com menu expandido:**
- Transformar o botão flutuante azul (que hoje abre só o checklist) em um menu com múltiplas opções:
  - Cronômetro/Checklist
  - Copiar todos
  - Buscar/Substituir
  - Corretor
  - Undo/Redo
  - Trocar guia
- Usar um Sheet/Popover que abre ao clicar no botão azul

**Toolbar inline por roteiro:**
- No mobile, esconder a toolbar lateral por roteiro (copiar, deletar, TTS, teleprompter) — mostrar apenas ao tocar e segurar ou via menu contextual dentro do botão flutuante

**Sidebar de guias:**
- No mobile, esconder completamente a sidebar de guias (já está estreita com `w-14`) e mover seleção de guia para o menu do botão flutuante

### Arquivos a modificar

1. `src/hooks/useMentoradosRoteiros.ts` — adicionar subscription realtime
2. `src/components/mentorados/MentoradoRoteirosView.tsx` — mobile UI limpa, desativar timer alert no mobile, reduzir debounce
3. Migration SQL — habilitar realtime na tabela `mentorados_roteiros`

