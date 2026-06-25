
CREATE TABLE public.mentorado_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorado_id uuid NOT NULL UNIQUE REFERENCES public.mentorados(id) ON DELETE CASCADE,
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  ativo boolean NOT NULL DEFAULT true,
  criado_por uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentorado_shares TO authenticated;
GRANT ALL ON public.mentorado_shares TO service_role;

ALTER TABLE public.mentorado_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth users manage mentorado_shares"
ON public.mentorado_shares FOR ALL
TO authenticated
USING (true) WITH CHECK (true);

CREATE TRIGGER update_mentorado_shares_updated_at
BEFORE UPDATE ON public.mentorado_shares
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: dado o slug/token do mentorado, retorna mentorado + lista de guias ativas (ativo=true em roteiro_guia_shares)
CREATE OR REPLACE FUNCTION public.get_mentorado_publico(_slug_or_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share public.mentorado_shares%ROWTYPE;
  v_mentorado_nome text;
  v_guias jsonb;
BEGIN
  SELECT * INTO v_share
  FROM public.mentorado_shares
  WHERE slug = _slug_or_token AND ativo = true
  LIMIT 1;

  IF NOT FOUND THEN
    BEGIN
      SELECT * INTO v_share
      FROM public.mentorado_shares
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
  WHERE s.mentorado_id = v_share.mentorado_id
    AND s.ativo = true;

  RETURN jsonb_build_object(
    'mentorado_nome', v_mentorado_nome,
    'guias', v_guias
  );
END;
$$;
