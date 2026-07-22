CREATE OR REPLACE FUNCTION public.get_mentorado_publico(_slug_or_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_share public.mentorado_shares%ROWTYPE;
  v_mentorado public.mentorados%ROWTYPE;
  v_guias jsonb;
BEGIN
  SELECT * INTO v_share FROM public.mentorado_shares WHERE slug = _slug_or_token AND ativo = true LIMIT 1;
  IF NOT FOUND THEN
    BEGIN
      SELECT * INTO v_share FROM public.mentorado_shares WHERE token = _slug_or_token::uuid AND ativo = true LIMIT 1;
    EXCEPTION WHEN invalid_text_representation THEN
      v_share := NULL;
    END;
  END IF;
  IF v_share.id IS NULL THEN
    RETURN jsonb_build_object('error', 'link_invalido');
  END IF;

  SELECT * INTO v_mentorado FROM public.mentorados WHERE id = v_share.mentorado_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'guia_numero', s.guia_numero,
    'slug', s.slug,
    'token', s.token,
    'nome', COALESCE(c.nome_customizado, 'Guia ' || s.guia_numero)
  ) ORDER BY s.guia_numero), '[]'::jsonb)
  INTO v_guias
  FROM public.roteiro_guia_shares s
  LEFT JOIN public.mentorados_guias_config c
    ON c.mentorado_id = s.mentorado_id AND c.numero = s.guia_numero
  WHERE s.mentorado_id = v_share.mentorado_id AND s.ativo = true;

  RETURN jsonb_build_object(
    'mentorado_nome', v_mentorado.nome,
    'mentorado_id', v_mentorado.id,
    'seguidores_atual', COALESCE(v_mentorado.seguidores_atual, 0),
    'guias', v_guias
  );
END;
$function$;