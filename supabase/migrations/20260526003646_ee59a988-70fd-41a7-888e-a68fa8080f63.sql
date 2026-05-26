
-- 1) novas colunas
ALTER TABLE public.roteiro_comentarios
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.roteiro_comentarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS arquivado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS audio_duracao_segundos numeric;

CREATE INDEX IF NOT EXISTS idx_roteiro_comentarios_parent ON public.roteiro_comentarios(parent_id);

-- 2) get_roteiro_publico_v2: inclui parent_id, audio_duracao_segundos; filtra arquivado
CREATE OR REPLACE FUNCTION public.get_roteiro_publico_v2(_slug_or_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_share public.roteiro_guia_shares%ROWTYPE;
  v_mentorado_nome text;
  v_guia_nome text;
  v_roteiros jsonb;
  v_comentarios jsonb;
BEGIN
  SELECT * INTO v_share
  FROM public.roteiro_guia_shares
  WHERE slug = _slug_or_token AND ativo = true
  LIMIT 1;

  IF NOT FOUND THEN
    BEGIN
      SELECT * INTO v_share
      FROM public.roteiro_guia_shares
      WHERE token = _slug_or_token::uuid AND ativo = true
      LIMIT 1;
    EXCEPTION WHEN invalid_text_representation THEN
      v_share := NULL;
    END;
  END IF;

  IF v_share.id IS NULL THEN
    RETURN jsonb_build_object('error', 'link_invalido');
  END IF;

  SELECT nome INTO v_mentorado_nome FROM public.mentorados WHERE id = v_share.mentorado_id;

  SELECT nome_customizado INTO v_guia_nome
  FROM public.mentorados_guias_config
  WHERE mentorado_id = v_share.mentorado_id AND numero = v_share.guia_numero
  LIMIT 1;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'ordem', ordem,
    'headline', headline,
    'estrutura', estrutura,
    'headline_audio_url', headline_audio_url
  ) ORDER BY ordem), '[]'::jsonb)
  INTO v_roteiros
  FROM public.mentorados_roteiros
  WHERE mentorado_id = v_share.mentorado_id
    AND guia_numero = v_share.guia_numero
    AND deleted_at IS NULL;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', id,
    'ordem', ordem,
    'escopo', escopo,
    'trecho_texto', trecho_texto,
    'autor_nome', autor_nome,
    'conteudo_texto', conteudo_texto,
    'audio_url', audio_url,
    'audio_duracao_segundos', audio_duracao_segundos,
    'parent_id', parent_id,
    'created_at', created_at
  ) ORDER BY ordem ASC,
    CASE escopo WHEN 'headline' THEN 1 WHEN 'estrutura' THEN 2 ELSE 3 END,
    created_at ASC), '[]'::jsonb)
  INTO v_comentarios
  FROM public.roteiro_comentarios
  WHERE share_id = v_share.id
    AND arquivado = false;

  RETURN jsonb_build_object(
    'share_id', v_share.id,
    'mentorado_nome', v_mentorado_nome,
    'guia_numero', v_share.guia_numero,
    'guia_nome', v_guia_nome,
    'roteiros', v_roteiros,
    'comentarios', v_comentarios
  );
END;
$function$;

-- 3) inserir_comentario_publico_v2: aceita parent_id e duracao
CREATE OR REPLACE FUNCTION public.inserir_comentario_publico_v2(
  _slug_or_token text,
  _ordem integer,
  _escopo text,
  _trecho_texto text,
  _autor_nome text,
  _conteudo_texto text,
  _audio_url text,
  _parent_id uuid DEFAULT NULL,
  _audio_duracao numeric DEFAULT NULL
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_share public.roteiro_guia_shares%ROWTYPE;
  v_id uuid;
BEGIN
  SELECT * INTO v_share
  FROM public.roteiro_guia_shares
  WHERE slug = _slug_or_token AND ativo = true
  LIMIT 1;

  IF NOT FOUND THEN
    BEGIN
      SELECT * INTO v_share
      FROM public.roteiro_guia_shares
      WHERE token = _slug_or_token::uuid AND ativo = true
      LIMIT 1;
    EXCEPTION WHEN invalid_text_representation THEN
      v_share := NULL;
    END;
  END IF;

  IF v_share.id IS NULL THEN
    RAISE EXCEPTION 'link_invalido';
  END IF;

  INSERT INTO public.roteiro_comentarios (
    share_id, mentorado_id, guia_numero, ordem, escopo,
    trecho_texto, autor_nome, conteudo_texto, audio_url,
    parent_id, audio_duracao_segundos
  ) VALUES (
    v_share.id, v_share.mentorado_id, v_share.guia_numero, _ordem, _escopo,
    _trecho_texto, _autor_nome, _conteudo_texto, _audio_url,
    _parent_id, _audio_duracao
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

-- 4) excluir_comentario_publico: agora ARQUIVA (não deleta)
CREATE OR REPLACE FUNCTION public.excluir_comentario_publico(_slug_or_token text, _comentario_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_share public.roteiro_guia_shares%ROWTYPE;
BEGIN
  SELECT * INTO v_share
  FROM public.roteiro_guia_shares
  WHERE slug = _slug_or_token AND ativo = true
  LIMIT 1;

  IF NOT FOUND THEN
    BEGIN
      SELECT * INTO v_share
      FROM public.roteiro_guia_shares
      WHERE token = _slug_or_token::uuid AND ativo = true
      LIMIT 1;
    EXCEPTION WHEN invalid_text_representation THEN
      v_share := NULL;
    END;
  END IF;

  IF v_share.id IS NULL THEN
    RAISE EXCEPTION 'link_invalido';
  END IF;

  UPDATE public.roteiro_comentarios
  SET arquivado = true
  WHERE id = _comentario_id
    AND share_id = v_share.id
    AND autor_user_id IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'comentario_nao_encontrado';
  END IF;
END;
$function$;
