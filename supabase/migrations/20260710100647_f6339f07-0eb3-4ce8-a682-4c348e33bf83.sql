
-- 1. estrutura_formatos
CREATE TABLE public.estrutura_formatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  ordem int NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estrutura_formatos TO authenticated;
GRANT ALL ON public.estrutura_formatos TO service_role;
ALTER TABLE public.estrutura_formatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ler formatos"
  ON public.estrutura_formatos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insere formatos"
  ON public.estrutura_formatos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin atualiza formatos"
  ON public.estrutura_formatos FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin exclui formatos"
  ON public.estrutura_formatos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_estrutura_formatos_updated_at
  BEFORE UPDATE ON public.estrutura_formatos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. estrutura_videos
CREATE TABLE public.estrutura_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formato_id uuid NOT NULL REFERENCES public.estrutura_formatos(id) ON DELETE CASCADE,
  titulo text,
  link_video text NOT NULL,
  imagem_path text,
  views bigint NOT NULL DEFAULT 0,
  transcricao text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX estrutura_videos_formato_id_idx ON public.estrutura_videos(formato_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estrutura_videos TO authenticated;
GRANT ALL ON public.estrutura_videos TO service_role;
ALTER TABLE public.estrutura_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ler videos"
  ON public.estrutura_videos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insere videos"
  ON public.estrutura_videos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin atualiza videos"
  ON public.estrutura_videos FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin exclui videos"
  ON public.estrutura_videos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_estrutura_videos_updated_at
  BEFORE UPDATE ON public.estrutura_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. estrutura_video_favoritos
CREATE TABLE public.estrutura_video_favoritos (
  user_id uuid NOT NULL,
  video_id uuid NOT NULL REFERENCES public.estrutura_videos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);
GRANT SELECT, INSERT, DELETE ON public.estrutura_video_favoritos TO authenticated;
GRANT ALL ON public.estrutura_video_favoritos TO service_role;
ALTER TABLE public.estrutura_video_favoritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario le seus favoritos"
  ON public.estrutura_video_favoritos FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Usuario insere seus favoritos"
  ON public.estrutura_video_favoritos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuario apaga seus favoritos"
  ON public.estrutura_video_favoritos FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 4. Storage policies para bucket estrutura-videos
CREATE POLICY "Autenticados leem estrutura-videos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'estrutura-videos');
CREATE POLICY "Admin insere estrutura-videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'estrutura-videos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin atualiza estrutura-videos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'estrutura-videos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin exclui estrutura-videos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'estrutura-videos' AND public.has_role(auth.uid(), 'admin'));
