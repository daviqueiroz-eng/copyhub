
CREATE TABLE public.perfis_referencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  inscritos TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL,
  nicho_id UUID REFERENCES public.nichos(id) ON DELETE SET NULL,
  favorito BOOLEAN NOT NULL DEFAULT false,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.perfis_referencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own perfis referencia" ON public.perfis_referencia
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
