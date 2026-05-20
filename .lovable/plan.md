## Áudio complementar na headline + waveform do mentorado

### 1. Gravar áudio na headline (editor do usuário)

**Onde aparece**: ao lado direito do botão de espada (votação) em cada headline no `MentoradoRoteirosView.tsx` (próximo da linha 3340–3360). Um pequeno botão de microfone (`Mic`) com tooltip "Gravar áudio complementar".

**Comportamento**:
- Clique inicia gravação inline (substitui o botão por: `Parar` + canvas com waveform animado + cronômetro em segundos, igual ao padrão do `RoteiroPublico`).
- Ao parar, sobe o blob para o bucket `roteiro-comentarios-audio` (já existe, público) no caminho `headline-audio/<mentorado_id>/<guia>/<ordem>-<timestamp>.<ext>` e salva a URL em uma nova coluna `headline_audio_url` em `mentorados_roteiros`.
- Quando já existe áudio: aparece um badge verde estilo "🎙 Áudio complementar" + player nativo `<audio controls>` compacto + botão `X` para apagar (limpa coluna e remove do bucket).
- O próprio usuário pode reproduzir clicando no player.

**Componente novo**: `HeadlineAudioRecorder.tsx` (encapsula gravação + waveform + upload + player) — usado dentro do bloco da headline. Reutiliza a mesma lógica de waveform corrigida (ver item 3).

### 2. Mentorado escuta o áudio no link público

**Database**:
- Migration: `ALTER TABLE mentorados_roteiros ADD COLUMN headline_audio_url text;`
- Atualizar `get_roteiro_publico_v2` (e `get_roteiro_publico`) para incluir `headline_audio_url` no `jsonb_build_object` dos roteiros.

**UI pública** (`RoteiroPublico.tsx`):
- Logo após o label "HEADLINE NN", se `roteiro.headline_audio_url` existir, renderizar um chip verde "🎙 Áudio complementar" com `<audio controls>` embutido (visual igual à imagem de referência: label verde manuscrito ao lado do "HEADLINE 01", e player abaixo do título).
- Mentorado **só escuta** — sem botão de apagar/editar.

### 3. Corrigir waveform durante gravação do mentorado

**Diagnóstico**: o canvas só monta quando `gravando=true`, mas `iniciarWaveform` é chamado no mesmo tick em que setGravando dispara — no primeiro `draw()` o `canvasRef.current` ainda é `null` e o loop sai (`return` sem reagendar `requestAnimationFrame`). Resultado: barra cinza vazia.

**Correção em `RoteiroPublico.tsx`**:
- No `draw()`, se `canvasRef.current` for null mas o analyser ainda existir, reagendar `requestAnimationFrame(draw)` em vez de retornar — assim ele tenta de novo no próximo frame, quando o canvas já estiver montado.
- Trocar para `getByteTimeDomainData` (onda senoidal contínua, mais perceptível como "fala") em vez de barras de frequência, ou manter barras mas usar mais ganho visual (`barH = Math.max(2, v * h * 1.5)`).
- Definir `canvas.width = canvas.clientWidth * devicePixelRatio` no primeiro frame válido, para evitar canvas esticado/borrado.

A mesma função (já corrigida) é reusada pelo `HeadlineAudioRecorder` do editor.

### Detalhes técnicos

**Arquivos a editar/criar**:
- `supabase/migrations/<timestamp>_headline_audio.sql` — adiciona coluna + atualiza as duas RPCs públicas.
- `src/components/mentorados/HeadlineAudioRecorder.tsx` (novo) — gravação, waveform, upload para `roteiro-comentarios-audio`, player, deletar.
- `src/components/mentorados/MentoradoRoteirosView.tsx` — montar `<HeadlineAudioRecorder ... />` ao lado do botão Swords; estender o tipo local de roteiro com `headline_audio_url`.
- `src/hooks/useMentoradosRoteiros.ts` — incluir `headline_audio_url` no select/insert/update (manter compatibilidade com salvamento atual).
- `src/pages/RoteiroPublico.tsx` — (a) corrigir loop de waveform; (b) renderizar badge "Áudio complementar" + player quando `headline_audio_url` vier do RPC.

**Storage**: o bucket `roteiro-comentarios-audio` já é público — políticas existentes de INSERT públicas serão reutilizadas. Para áudios do dono (editor logado) o upload ocorrerá autenticado normalmente.

**Sem mudança** em: ordenação de comentários, sistema de edição de comentário do mentorado, slug, ou qualquer outra parte do app.
