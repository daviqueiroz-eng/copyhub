## Atualizações no sistema de compartilhamento de roteiros

### 1. Copiar link sempre com URL personalizada atualizada
- No `ShareGuiaDialog`, atualmente o campo `url` usa `share?.slug || share?.token`, mas depois de salvar um slug novo o estado local pode estar "atrás" do cache. Garantir que após `salvarSlug` o React Query invalide imediatamente e o input mostre o slug novo antes do copy.
- Ajustar `useAtualizarShareSlug` para retornar o registro atualizado (`.select().single()`) e fazer `setQueryData` otimista da chave `["roteiro-share", mentoradoId, guiaNumero]`, assim o `url` no diálogo já reflete o novo slug imediatamente, sem precisar reabrir.

### 2. Mentorado pode editar o próprio comentário + visualização de onda no áudio
- **Edição de comentário (RoteiroPublico)**: cada comentário criado pelo visitante guarda um id local (em `localStorage`, chave `roteiro_publico_meus_comentarios_<share_id>`) com a lista de ids que ele criou. Apenas comentários cujo id estiver nessa lista mostram botão "Editar" e "Excluir".
- Backend: criar duas RPCs `SECURITY DEFINER`:
  - `atualizar_comentario_publico(_slug_or_token text, _comentario_id uuid, _conteudo_texto text)` — só permite update se o comentário pertence ao share resolvido e não tem `autor_user_id` (foi feito pelo público). Apenas texto é editável (áudio fica imutável para simplicidade).
  - `excluir_comentario_publico(_slug_or_token text, _comentario_id uuid)` — mesma regra.
- UI: ao clicar "Editar", o conteúdo vira um `Textarea` inline com botões "Salvar/Cancelar".
- **Visualização da onda do áudio durante gravação**: usar `AudioContext` + `AnalyserNode` em paralelo ao `MediaRecorder`. Desenhar uma onda animada em um `<canvas>` (waveform tipo barras verticais reagindo ao `getByteFrequencyData`) abaixo do botão de gravar enquanto `isRecording`. Limpar tudo ao parar.

### 3. Esconder referências (link_referencia) do mentorado
- Em `get_roteiro_publico_v2` (e `get_roteiro_publico`), remover `link_referencia` do `jsonb_build_object` dos roteiros, retornando apenas `ordem`, `headline`, `estrutura`.
- Em `RoteiroPublico.tsx`, remover qualquer renderização do badge "Referência".

### 4. Ordenar comentários pela posição do roteiro (não pela data)
- No painel lateral (`RoteiroComentariosPanel`) e na página pública, ordenar a lista por:
  1. `ordem` ASC (número do roteiro/headline)
  2. `escopo` na ordem `headline` → `estrutura` → `selecao`
  3. `created_at` ASC (desempate dentro do mesmo ponto)
- Aplicar tanto no SELECT do hook `useRoteiroComentarios` quanto no `get_roteiro_publico_v2` (ORDER BY na agregação).
- Resultado: se o mentorado comenta H1→E2→H1 novamente, o segundo comentário em H1 fica imediatamente abaixo do primeiro comentário de H1, em ordem cronológica dentro daquele bloco — e E2 fica abaixo de tudo do bloco 1.

### Detalhes técnicos
- **Arquivos editados**:
  - `src/components/mentorados/ShareGuiaPopover.tsx` — atualização otimista do slug
  - `src/hooks/useRoteiroShares.ts` — `useAtualizarShareSlug` retorna registro + setQueryData
  - `src/pages/RoteiroPublico.tsx` — waveform, editar/excluir próprios comentários, remover referência, ordenação
  - `src/components/mentorados/RoteiroComentariosPanel.tsx` — ordenação por posição
  - `src/hooks/useRoteiroComentarios.ts` — ORDER BY ordem, escopo_rank, created_at
- **Nova migration**:
  - Atualizar `get_roteiro_publico_v2` (remover `link_referencia`, ordenar comentários por ordem+escopo+created_at)
  - Criar `atualizar_comentario_publico` e `excluir_comentario_publico` (SECURITY DEFINER, restritas a comentários públicos do share)
- **localStorage** identifica quais comentários o visitante pode editar (sem login).
