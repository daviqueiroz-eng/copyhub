
CREATE TABLE public.controle_levas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mentorado_id UUID NOT NULL REFERENCES public.mentorados(id) ON DELETE CASCADE,
  numero_leva INTEGER NOT NULL DEFAULT 1,
  data_inicio DATE NOT NULL,
  dias_uteis INTEGER DEFAULT 10,
  data_prevista DATE,
  data_real DATE,
  concluida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.controle_levas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own levas" ON public.controle_levas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own levas" ON public.controle_levas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own levas" ON public.controle_levas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own levas" ON public.controle_levas
  FOR DELETE USING (auth.uid() = user_id);
