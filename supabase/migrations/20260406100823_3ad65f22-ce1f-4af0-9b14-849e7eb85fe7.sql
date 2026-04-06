
-- Overrides compartilhados (posições de cards arrastados)
CREATE TABLE public.bussola_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stable_key TEXT NOT NULL UNIQUE,
  nova_data TEXT NOT NULL,
  data_original TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bussola_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all overrides"
  ON public.bussola_overrides FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert overrides"
  ON public.bussola_overrides FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update overrides"
  ON public.bussola_overrides FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete overrides"
  ON public.bussola_overrides FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_bussola_overrides_updated_at
  BEFORE UPDATE ON public.bussola_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários nos cards
CREATE TABLE public.bussola_comentarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stable_key TEXT NOT NULL,
  comentario TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bussola_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all comments"
  ON public.bussola_comentarios FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON public.bussola_comentarios FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own comments"
  ON public.bussola_comentarios FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_bussola_comentarios_key ON public.bussola_comentarios(stable_key);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.bussola_overrides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bussola_comentarios;
