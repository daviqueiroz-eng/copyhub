
CREATE TABLE public.mentorado_mapas_mentais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentorado_id UUID NOT NULL REFERENCES public.mentorados(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT 'Mapa mental',
  ordem INTEGER NOT NULL DEFAULT 0,
  snapshot JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentorado_mapas_mentais TO authenticated;
GRANT ALL ON public.mentorado_mapas_mentais TO service_role;

ALTER TABLE public.mentorado_mapas_mentais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated leem mapas"
  ON public.mentorado_mapas_mentais FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated criam mapas"
  ON public.mentorado_mapas_mentais FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated editam mapas"
  ON public.mentorado_mapas_mentais FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated apagam mapas"
  ON public.mentorado_mapas_mentais FOR DELETE
  TO authenticated USING (true);

CREATE INDEX idx_mapas_mentorado ON public.mentorado_mapas_mentais(mentorado_id, ordem);

CREATE TRIGGER update_mapas_mentais_updated_at
  BEFORE UPDATE ON public.mentorado_mapas_mentais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Atualiza RPC pública para incluir mapas mentais
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
  v_mapas jsonb;
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

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', id,
    'nome', nome,
    'ordem', ordem
  ) ORDER BY ordem, created_at), '[]'::jsonb)
  INTO v_mapas
  FROM public.mentorado_mapas_mentais
  WHERE mentorado_id = v_share.mentorado_id;

  RETURN jsonb_build_object(
    'mentorado_nome', v_mentorado.nome,
    'mentorado_id', v_mentorado.id,
    'seguidores_atual', COALESCE(v_mentorado.seguidores_atual, 0),
    'guias', v_guias,
    'mapas_mentais', v_mapas
  );
END;
$function$;

-- Função pública para buscar snapshot de um mapa via slug/token do mentorado
CREATE OR REPLACE FUNCTION public.get_mapa_mental_publico(_slug_or_token text, _mapa_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_share public.mentorado_shares%ROWTYPE;
  v_mapa public.mentorado_mapas_mentais%ROWTYPE;
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

  SELECT * INTO v_mapa FROM public.mentorado_mapas_mentais
  WHERE id = _mapa_id AND mentorado_id = v_share.mentorado_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'mapa_nao_encontrado');
  END IF;

  RETURN jsonb_build_object(
    'id', v_mapa.id,
    'nome', v_mapa.nome,
    'snapshot', v_mapa.snapshot
  );
END;
$function$;
