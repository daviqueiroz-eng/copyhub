
-- Add missing columns to mentorados
ALTER TABLE public.mentorados 
  ADD COLUMN IF NOT EXISTS mentor text,
  ADD COLUMN IF NOT EXISTS curso text,
  ADD COLUMN IF NOT EXISTS cor text DEFAULT '#3B82F6',
  ADD COLUMN IF NOT EXISTS pausado boolean DEFAULT false;

-- Create gestao_entregas table
CREATE TABLE public.gestao_entregas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorado_id uuid NOT NULL REFERENCES public.mentorados(id) ON DELETE CASCADE,
  responsavel_id uuid REFERENCES public.profiles(user_id),
  user_id uuid NOT NULL,
  leva integer,
  prazo date NOT NULL,
  data_entrega date,
  dias_uteis integer DEFAULT 10,
  status text DEFAULT 'Em andamento',
  observacao text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gestao_entregas ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own entregas"
  ON public.gestao_entregas FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own entregas"
  ON public.gestao_entregas FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own entregas"
  ON public.gestao_entregas FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own entregas"
  ON public.gestao_entregas FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
