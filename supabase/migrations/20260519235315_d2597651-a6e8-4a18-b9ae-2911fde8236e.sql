
-- Tabela de tokens de compartilhamento por guia
CREATE TABLE public.roteiro_guia_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorado_id uuid NOT NULL,
  guia_numero int NOT NULL,
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  ativo boolean NOT NULL DEFAULT true,
  criado_por uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mentorado_id, guia_numero)
);

ALTER TABLE public.roteiro_guia_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados veem shares" ON public.roteiro_guia_shares
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados criam shares" ON public.roteiro_guia_shares
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = criado_por);
CREATE POLICY "Autenticados atualizam shares" ON public.roteiro_guia_shares
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Autenticados deletam shares" ON public.roteiro_guia_shares
  FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_roteiro_guia_shares_updated_at
  BEFORE UPDATE ON public.roteiro_guia_shares
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de comentários
CREATE TABLE public.roteiro_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id uuid REFERENCES public.roteiro_guia_shares(id) ON DELETE CASCADE,
  mentorado_id uuid NOT NULL,
  guia_numero int NOT NULL,
  ordem int NOT NULL,
  escopo text NOT NULL CHECK (escopo IN ('headline','estrutura','selecao')),
  trecho_texto text,
  autor_nome text NOT NULL,
  autor_user_id uuid,
  conteudo_texto text,
  audio_url text,
  resolvido boolean NOT NULL DEFAULT false,
  lido_por jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roteiro_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados veem comentarios" ON public.roteiro_comentarios
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados criam comentarios" ON public.roteiro_comentarios
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = autor_user_id);
CREATE POLICY "Autenticados atualizam comentarios" ON public.roteiro_comentarios
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Autenticados deletam comentarios" ON public.roteiro_comentarios
  FOR DELETE TO authenticated USING (auth.uid() = autor_user_id);

CREATE INDEX idx_roteiro_comentarios_mentorado_guia ON public.roteiro_comentarios(mentorado_id, guia_numero);
CREATE INDEX idx_roteiro_comentarios_share ON public.roteiro_comentarios(share_id);

-- Bucket público para áudios
INSERT INTO storage.buckets (id, name, public) VALUES ('roteiro-comentarios-audio', 'roteiro-comentarios-audio', true);

CREATE POLICY "Audios publicos sao legiveis" ON storage.objects
  FOR SELECT USING (bucket_id = 'roteiro-comentarios-audio');
CREATE POLICY "Qualquer um faz upload de audio comentario" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'roteiro-comentarios-audio');

-- Função pública: pega roteiro readonly via token
CREATE OR REPLACE FUNCTION public.get_roteiro_publico(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
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
  WHERE mentorado_id = v_share.mentorado_id AND guia_numero = v_share.guia_numero;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'ordem', ordem,
    'headline', headline,
    'estrutura', estrutura,
    'link_referencia', link_referencia
  ) ORDER BY ordem), '[]'::jsonb)
  INTO v_roteiros
  FROM public.mentorados_roteiros
  WHERE mentorado_id = v_share.mentorado_id AND guia_numero = v_share.guia_numero;

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

GRANT EXECUTE ON FUNCTION public.get_roteiro_publico(uuid) TO anon, authenticated;

-- Função pública: inserir comentário anônimo
CREATE OR REPLACE FUNCTION public.inserir_comentario_publico(
  _token uuid,
  _ordem int,
  _escopo text,
  _trecho_texto text,
  _autor_nome text,
  _conteudo_texto text,
  _audio_url text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share public.roteiro_guia_shares%ROWTYPE;
  v_id uuid;
BEGIN
  SELECT * INTO v_share FROM public.roteiro_guia_shares WHERE token = _token AND ativo = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'link_invalido';
  END IF;
  IF _escopo NOT IN ('headline','estrutura','selecao') THEN
    RAISE EXCEPTION 'escopo_invalido';
  END IF;
  IF COALESCE(trim(_autor_nome),'') = '' THEN
    RAISE EXCEPTION 'nome_obrigatorio';
  END IF;
  IF COALESCE(trim(_conteudo_texto),'') = '' AND COALESCE(trim(_audio_url),'') = '' THEN
    RAISE EXCEPTION 'conteudo_obrigatorio';
  END IF;

  INSERT INTO public.roteiro_comentarios (
    share_id, mentorado_id, guia_numero, ordem, escopo, trecho_texto,
    autor_nome, autor_user_id, conteudo_texto, audio_url
  ) VALUES (
    v_share.id, v_share.mentorado_id, v_share.guia_numero, _ordem, _escopo, _trecho_texto,
    _autor_nome, NULL, _conteudo_texto, _audio_url
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.inserir_comentario_publico(uuid,int,text,text,text,text,text) TO anon, authenticated;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.roteiro_comentarios;
ALTER PUBLICATION supabase_realtime ADD TABLE public.roteiro_guia_shares;
