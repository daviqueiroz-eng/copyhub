
-- Add new columns to gestao_entregas
ALTER TABLE public.gestao_entregas 
  ADD COLUMN IF NOT EXISTS roteiros_por_leva integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS levas_totais integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS mentor text DEFAULT NULL;

-- Config table to remember per-mentorado settings for subsequent drags
CREATE TABLE IF NOT EXISTS public.gestao_entregas_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mentorado_id uuid NOT NULL REFERENCES public.mentorados(id) ON DELETE CASCADE,
  mentor text DEFAULT NULL,
  dias_uteis integer DEFAULT 10,
  roteiros_por_leva integer DEFAULT NULL,
  levas_totais integer DEFAULT NULL,
  status text DEFAULT 'Em andamento',
  leva_atual integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, mentorado_id)
);

ALTER TABLE public.gestao_entregas_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own config"
ON public.gestao_entregas_config
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
