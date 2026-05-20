
CREATE OR REPLACE FUNCTION public.get_roteiro_publico(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share public.roteiro_guia_shares%ROWTYPE;
  v_mentorado_nome text;
  v_guia_nome text;
  v_roteiros jsonb;
  v_comentarios jsonb;
BEGIN
  SELECT * INTO v_share FROM public.roteiro_guia_shares WHERE token = _token AND ativo = true;
  IF NOT FOUND THEN
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
$$;
