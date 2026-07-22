
ALTER TABLE public.mentorados ADD COLUMN IF NOT EXISTS seguidores_atual BIGINT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.mentorado_conquistas_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentorado_id UUID NOT NULL REFERENCES public.mentorados(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL DEFAULT '',
  link TEXT,
  thumbnail_url TEXT,
  visualizacoes BIGINT NOT NULL DEFAULT 0,
  data_publicacao DATE,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentorado_conquistas_videos TO authenticated;
GRANT SELECT ON public.mentorado_conquistas_videos TO anon;
GRANT ALL ON public.mentorado_conquistas_videos TO service_role;

ALTER TABLE public.mentorado_conquistas_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conquistas videos visíveis para todos autenticados"
  ON public.mentorado_conquistas_videos FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Conquistas videos leitura pública"
  ON public.mentorado_conquistas_videos FOR SELECT
  TO anon USING (true);

CREATE POLICY "Autenticados podem inserir conquistas videos"
  ON public.mentorado_conquistas_videos FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Autenticados podem atualizar conquistas videos"
  ON public.mentorado_conquistas_videos FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "Autenticados podem deletar conquistas videos"
  ON public.mentorado_conquistas_videos FOR DELETE
  TO authenticated USING (true);

CREATE TRIGGER update_mentorado_conquistas_videos_updated_at
  BEFORE UPDATE ON public.mentorado_conquistas_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
