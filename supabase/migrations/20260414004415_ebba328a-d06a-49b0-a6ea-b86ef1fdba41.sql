CREATE TABLE public.termos_virais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  termo text NOT NULL,
  nicho_id uuid REFERENCES public.nichos(id) ON DELETE SET NULL,
  views text DEFAULT '',
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.termos_virais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_termos" ON public.termos_virais FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_termos" ON public.termos_virais FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "delete_termos" ON public.termos_virais FOR DELETE TO authenticated USING (true);
CREATE POLICY "update_termos" ON public.termos_virais FOR UPDATE TO authenticated USING (true);