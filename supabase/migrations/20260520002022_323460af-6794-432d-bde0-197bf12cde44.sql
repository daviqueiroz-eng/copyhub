
-- Add slug column for custom share URLs
ALTER TABLE public.roteiro_guia_shares
  ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Updated public roteiro lookup: accepts slug OR token as text
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
  -- Try slug first
  SELECT * INTO v_share
  FROM public.roteiro_guia_shares
  WHERE slug = _slug_or_token AND ativo = true
  LIMIT 1;

  -- Fallback: try as UUID token
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
    'link_referencia', link_referencia
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
    'created_at', created_at
  ) ORDER BY created_at), '[]'::jsonb)
  INTO v_comentarios
  FROM public.roteiro_comentarios
  WHERE share_id = v_share.id;

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

GRANT EXECUTE ON FUNCTION public.get_roteiro_publico_v2(text) TO anon, authenticated;

-- Insert comment by slug or token
CREATE OR REPLACE FUNCTION public.inserir_comentario_publico_v2(
  _slug_or_token text,
  _ordem integer,
  _escopo text,
  _trecho_texto text,
  _autor_nome text,
  _conteudo_texto text,
  _audio_url text
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
    trecho_texto, autor_nome, conteudo_texto, audio_url
  ) VALUES (
    v_share.id, v_share.mentorado_id, v_share.guia_numero, _ordem, _escopo,
    _trecho_texto, _autor_nome, _conteudo_texto, _audio_url
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.inserir_comentario_publico_v2(text, integer, text, text, text, text, text) TO anon, authenticated;
