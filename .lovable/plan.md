
Problema mais provável: eu já consigo ver que a rota `/mentorados` monta automaticamente a área de gestão com a aba **Bússola dos Copy** ativa. Isso dispara, no carregamento inicial, um fetch pesado da planilha (`fetch-google-sheet`) + render do `FullCalendar` com muitos eventos. No Chrome isso tende a ser mais sensível e pode derrubar a renderização, enquanto no Safari continua estável. Em paralelo, o fluxo de autenticação ainda está frágil e pode deixar queries protegidas rodando cedo demais.

### Plano para corrigir

#### 1. Parar a quebra no carregamento inicial
Vou tornar a entrada em `/mentorados` “segura”:
- mudar o estado inicial da área de gestão para uma aba mais leve (`calendario`)
- persistir a última aba aberta, mas com fallback seguro
- fazer **lazy mount** das tabs, para que `BussolaCopyView` só seja montado quando o usuário realmente abrir a Bússola

Isso evita que todos os usuários carreguem a parte mais pesada logo ao entrar.

#### 2. Deixar a Bússola leve e resistente
Vou ajustar o fluxo da Bússola para não derrubar a página:
- `useBussolaCopy` passa a aceitar `enabled`
- desativar `refetchOnWindowFocus` e remover `refetchOnMount: "always"`
- aumentar cache/stale time para evitar refetch agressivo
- só renderizar o `FullCalendar` quando os dados estiverem prontos
- se não houver filtro/cópia selecionada, mostrar estado vazio leve em vez de tentar desenhar tudo de uma vez
- adicionar estado de erro com botão de “Tentar novamente”

#### 3. Blindar a inicialização da autenticação
Vou corrigir a corrida de sessão:
- adicionar um estado explícito de `authReady` no `AuthContext`
- só liberar `ProtectedRoute` e consultas protegidas depois que a sessão estiver restaurada
- manter `onAuthStateChange` apenas para mudanças posteriores, sem depender dele para a primeira hidratação
- evitar checks prematuros que podem variar entre navegadores

#### 4. Impedir nova tela branca mesmo se algo falhar
Vou colocar fallback visual no fluxo de Mentorados:
- erro da Bússola ou da planilha não pode mais apagar a aplicação toda
- se a área direita falhar, o usuário continua vendo sidebar, lista de mentorados e uma mensagem clara com retry

### Arquivos que vou ajustar
- `src/contexts/AuthContext.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/components/mentorados/GestaoEntregasView.tsx`
- `src/components/mentorados/BussolaCopyView.tsx`
- `src/hooks/useBussolaCopy.ts`
- possivelmente um novo componente de fallback/error boundary para a área de Mentorados

### Resultado esperado
- Chrome para de “apagar” a tela ao abrir `/mentorados`
- outros usuários conseguem entrar normalmente
- a Bússola continua existindo, mas deixa de travar a página no carregamento
- Safari segue funcionando igual
- se a planilha atrasar ou falhar, a página continua utilizável

### Detalhes técnicos
- Hoje a Bússola é montada automaticamente via `GestaoEntregasView` com `defaultValue="bussola"`.
- `useBussolaCopy` está configurado com `staleTime: 0`, `refetchOnWindowFocus: true` e `refetchOnMount: "always"`, o que piora bastante no Chrome.
- A edge function `fetch-google-sheet` varre muitas abas e retorna um volume potencialmente alto; o gargalo mais provável é o render subsequente no `FullCalendar`.
- Como não apareceu erro runtime claro nos logs, a correção mais segura é reduzir carga no mount + endurecer a hidratação de auth + adicionar fallback visual.
