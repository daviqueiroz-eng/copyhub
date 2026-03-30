

## Plano de Ajustes — Bússola dos Copy

### Problema 1: Arrastar cards no calendário (cor verde + data original)

Permitir arrastar eventos no calendário. Quando arrastado:
- O card muda a borda para verde (indicando que foi movido manualmente)
- O texto interno continua mostrando a data original da planilha
- A posição local é armazenada em estado (não persiste — é visual)
- Quando os dados da planilha forem recarregados (refetch), todos os cards voltam à posição correta automaticamente

**Alterações em `BussolaCopyView.tsx`:**
- Habilitar `editable={true}` e `eventStartEditable={true}`
- Criar estado `localOverrides: Record<string, string>` para armazenar posições arrastadas
- No `eventDrop`, salvar o override e marcar o evento como "movido"
- No `eventContent`, se o evento foi movido, usar borda verde (`border-left: 3px solid green`)
- Limpar `localOverrides` quando `entries` mudar (novo fetch = reset)

### Problema 2: Subir o calendário ao topo

O calendário está muito abaixo. Precisa alinhar com o nível do título "Meus Mentorados".

**Alterações em `GestaoEntregasView.tsx`:**
- Remover margens e paddings superiores desnecessários
- Reduzir `mb-1` e qualquer espaçamento entre TabsList e conteúdo
- Esconder badges de categorias (Pausado, Churn, etc.) quando a aba ativa é "bussola"

**Alterações em `BussolaCopyView.tsx`:**
- Remover `-mt-1` e qualquer espaçamento superior, usar `mt-0` ou negativo se necessário
- Compactar header do calendário (reduzir gaps, paddings)

### Problema 3: Nomes faltando (Rafael Nunes, Deidara, etc.)

O edge function `fetch-google-sheet` não está descobrindo todos os GIDs das abas corretamente. O método `discoverSheetGids()` que faz scraping de HTML é frágil.

**Alterações em `supabase/functions/fetch-google-sheet/index.ts`:**
- Substituir `discoverSheetGids()` por uma abordagem mais robusta:
  1. Buscar a URL `pubhtml` do spreadsheet (`/pubhtml`) que é pública e lista todas as abas como links com `gid=`
  2. Extrair GIDs de múltiplos padrões: `gid=N`, `"gid":"N"`, `sheetId":N`
  3. Sempre incluir `gid=0` no set
  4. Manter o fallback hardcoded mas expandi-lo com os GIDs que faltam
- Aumentar o batch size de 5 para 10 para processar mais rápido
- Também aceitar abas que tenham coluna `copy` (não apenas `cliente`), pois algumas abas podem ter headers ligeiramente diferentes

### Arquivos a modificar

1. `src/components/mentorados/BussolaCopyView.tsx` — drag com cor verde, subir layout
2. `src/components/mentorados/GestaoEntregasView.tsx` — esconder categorias na aba bussola, reduzir espaçamento
3. `supabase/functions/fetch-google-sheet/index.ts` — fix GID discovery para pegar todas as abas

