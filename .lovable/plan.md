## O que será feito

### 1. Respostas em comentários (conversa entre mentor e mentorado)
- Cada comentário poderá receber respostas em thread (lista aninhada abaixo do comentário pai).
- Mentor responde pelo painel interno (`RoteiroComentariosPanel`).
- Mentorado responde pela página pública (`RoteiroPublico`), com texto e/ou áudio (mesma UX da criação de comentário, incluindo waveform).
- Respostas aparecem em tempo real nos dois lados (já existe canal realtime na tabela `roteiro_comentarios`, será reaproveitado).
- Marcação de "Resolver" continua valendo só para o comentário pai (resolve a thread inteira visualmente).

### 2. Duração do áudio sempre visível
- Hoje o player nativo mostra `00:00` até o usuário dar play, porque os blobs gravados via MediaRecorder (webm/opus) não trazem `duration` no metadata.
- Será criado um componente `AudioPlayer` reutilizável que:
  - Calcula a duração real medindo o blob/URL com `AudioContext.decodeAudioData` (ou seek-trick `audio.currentTime = 1e9`).
  - Mostra `mm:ss / mm:ss` ao lado do play, mesmo antes de tocar.
  - Substituirá os `<audio controls>` no painel interno e na página pública.

### 3. Preservação total do histórico (regra permanente)
- Nenhum comentário, resposta ou áudio será apagado fisicamente, agora ou em atualizações futuras.
- Botão de lixeira no painel interno e na página pública passa a ser **arquivar** (soft delete): some da visualização padrão, mas fica registrado no banco.
- Adicionado toggle "Mostrar arquivados" no painel para auditoria.
- Será salvo na memória do projeto como regra Core: *"Comentários, respostas e áudios nunca são apagados — apenas arquivados (soft delete)."*

---

## Detalhes técnicos

### Banco (`supabase--migration`)
```sql
ALTER TABLE public.roteiro_comentarios
  ADD COLUMN parent_id uuid REFERENCES public.roteiro_comentarios(id),
  ADD COLUMN arquivado boolean NOT NULL DEFAULT false,
  ADD COLUMN audio_duracao_segundos numeric;

CREATE INDEX idx_roteiro_comentarios_parent ON public.roteiro_comentarios(parent_id);
```
- `parent_id` → respostas referenciam o comentário pai.
- `arquivado` substitui o DELETE.
- `audio_duracao_segundos` cache opcional, gravado no upload (evita recomputar).

### RPCs atualizadas
- `get_roteiro_publico_v2`: retorna `parent_id`, `arquivado`, `audio_duracao_segundos`; filtra `arquivado = false` por padrão.
- `inserir_comentario_publico_v2`: aceita novo parâmetro `_parent_id uuid` e `_audio_duracao numeric`.
- Nova RPC `arquivar_comentario_publico(_slug_or_token, _comentario_id)` (mentorado arquiva o próprio).
- `excluir_comentario_publico` deixa de deletar — passa a marcar `arquivado = true` (mantém assinatura para compatibilidade).

### Frontend
- `useRoteiroComentarios.ts`: novo hook `useResponderComentario` (interno) e `useArquivarComentario`; query passa a montar árvore (pai + `respostas[]`).
- `RoteiroComentariosPanel.tsx`: renderiza thread, botão "Responder" abre mini-form (texto + mic), botão lixeira vira "Arquivar".
- `RoteiroPublico.tsx`: idem para o mentorado — botão "Responder" abaixo de cada comentário do mentor, com mesmo recorder/waveform já existente.
- Novo `src/components/mentorados/AudioPlayer.tsx`: player customizado com duração pré-calculada, usado nos dois lados.
- Ordenação das threads: pai pela regra atual (ordem → escopo → created_at); respostas por `created_at ASC` dentro do pai.

### Arquivos afetados
- `supabase/migrations/<novo>.sql` (novo)
- `src/hooks/useRoteiroComentarios.ts`
- `src/components/mentorados/RoteiroComentariosPanel.tsx`
- `src/components/mentorados/AudioPlayer.tsx` (novo)
- `src/components/mentorados/HeadlineAudioRecorder.tsx` (gravar duração no upload)
- `src/pages/RoteiroPublico.tsx`
- `mem://index.md` + nova entrada de memória sobre soft-delete permanente
