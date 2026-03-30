
Vou implementar em 3 frentes objetivas:

1. Botão “Reprocessar” ao lado de “Acessar planilha”
- Adicionar um botão visível no header da `BussolaCopyView`.
- Esse botão vai disparar um refetch manual da query `["bussola-copy"]`.
- Durante o reprocessamento, o botão mostra loading/estado desabilitado.
- Ao concluir, mostrar feedback claro de sucesso ou erro.

2. Ajustar a sincronização para realmente trazer nomes novos
- Hoje a UI já usa dados dinâmicos, então o problema está no backend de leitura da planilha.
- Vou reforçar `fetch-google-sheet` para:
  - descobrir abas de forma mais confiável;
  - aceitar melhor variações de cabeçalhos da planilha;
  - evitar descartar linhas válidas por filtros muito rígidos.
- Também vou revisar a normalização do campo `copy`, porque o filtro de nomes depende disso e nomes como “Rafael Nunes” precisam entrar nessa lista imediatamente após o reprocessamento.

3. Melhorar o hook de dados para suporte ao botão
- Atualizar `useBussolaCopy` para expor `refetch`, `isFetching` e permitir um fluxo manual de atualização mais controlado.
- Manter os refreshes automáticos existentes, mas somar a eles o refresh manual explícito.

Arquivos que pretendo alterar
- `src/components/mentorados/BussolaCopyView.tsx`
- `src/hooks/useBussolaCopy.ts`
- `supabase/functions/fetch-google-sheet/index.ts`

O que vou validar ao implementar
- Clicar em “Reprocessar” atualiza a lista sem precisar sair da tela.
- O nome “Rafael Nunes” passa a aparecer no filtro.
- O dropdown continua funcional e com rolagem correta.
- O calendário continua usando os dados atualizados após o reprocessamento.

Detalhe importante
- Na inspeção que fiz, a função atual já retorna muitos registros, mas a descoberta de abas da planilha ainda está frágil. Então o botão sozinho não resolve; ele precisa vir junto com o ajuste da leitura da planilha para garantir que nomes novos realmente entrem no calendário.
