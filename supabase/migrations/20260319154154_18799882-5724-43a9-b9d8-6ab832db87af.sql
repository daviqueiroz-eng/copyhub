
CREATE TABLE public.gestao_entregas_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.gestao_entregas_status ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Todos podem ver status" ON public.gestao_entregas_status
  FOR SELECT TO authenticated USING (true);

-- Everyone can insert
CREATE POLICY "Todos podem criar status" ON public.gestao_entregas_status
  FOR INSERT TO authenticated WITH CHECK (true);

-- Seed default statuses
INSERT INTO public.gestao_entregas_status (nome) VALUES
  ('Em andamento'),
  ('Finalizado'),
  ('Atrasado'),
  ('Pausado'),
  ('Bateu 1M');
