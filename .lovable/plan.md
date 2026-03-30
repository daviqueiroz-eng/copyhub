

## Plano de Ajustes — Bússola dos Copy (4 itens)

### 1. Reordenar abas: Bússola primeiro

Em `GestaoEntregasView.tsx`, mover a tab "Bússola dos Copy" para a primeira posição (antes de Calendário e Tabela) e alterar `defaultValue` para `"bussola"`.

### 2. Subir o calendário ao máximo

**`Mentorados.tsx`**: Reduzir `pb-3 md:pb-4` do header para `pb-1`, reduzir `h-[calc(100vh-10rem)]` para `h-[calc(100vh-7rem)]`.

**`GestaoEntregasView.tsx`**: Reduzir `mb-0` e `gap-1` no container dos tabs. Remover qualquer `mt` no TabsContent da bússola.

**`BussolaCopyView.tsx`**: Reduzir `mb-0.5` do header para `mb-0`. Aumentar `min-height` das células do calendário.

### 3. Nomes faltando (Rafael Nunes, Deidara, etc.)

O problema está no `discoverSheetGids()` do edge function — ele não encontra todos os GIDs das abas. O `cliente` filter também pode excluir abas onde o header é "CLIENTE" (maiúsculo) ou "Mentorado:".

**`supabase/functions/fetch-google-sheet/index.ts`:**
- O `normalizeHeader` já faz lowercase, mas o filtro `r.cliente` está case-sensitive no campo. Verificar se abas como "Deidara" usam header `CLIENTE` vs `cliente` (ambos devem funcionar via `normalizeHeader`).
- O problema real: o campo na aba "Deidara" usa header `CLIENTE` e `COPY` (maiúsculos) — o `normalizeHeader` já lida com isso, mas o filtro de validação `hasCopy || hasCliente` pode estar filtrando abas com headers como `mentorado:` (com dois pontos).
- Expandir o filtro para aceitar headers que contenham `cliente` ou `mentorado` (parcial match).
- Adicionar mais padrões de regex para capturar GIDs: `switchToSheet\((\d+)\)`, `"sheetId":"(\d+)"`, tabs no rodapé como `sheet-tab-(\d+)`.
- Aumentar o fallback hardcoded com mais GIDs conhecidos (extraídos da planilha na imagem: Deidara = `gid=278638133`, Rafael Nunes tem seu próprio GID).

### 4. Arrastar cards com persistência via localStorage

Atualmente o arraste funciona mas `localOverrides` é resetado ao recarregar a página (é estado em memória).

**`BussolaCopyView.tsx`:**
- Persistir `localOverrides` em `localStorage` (key: `bussola-overrides`).
- No init, carregar do localStorage.
- Ao salvar um novo override, gravar no localStorage.
- Ao receber dados novos (entries muda), comparar: para cada override, se a data original da planilha mudou, remover o override (a planilha foi atualizada). Caso contrário, manter o override.
- Isso garante que: (a) arrastar persiste entre recargas, (b) se a planilha atualiza a data, o override é descartado.

### Arquivos a modificar

1. `src/pages/Mentorados.tsx` — reduzir espaçamento do header
2. `src/components/mentorados/GestaoEntregasView.tsx` — reordenar tabs, bússola primeiro
3. `src/components/mentorados/BussolaCopyView.tsx` — persistir overrides em localStorage, subir layout
4. `supabase/functions/fetch-google-sheet/index.ts` — melhorar descoberta de GIDs e filtros de headers

