ALTER TABLE public.virais ADD COLUMN IF NOT EXISTS perfil_id uuid REFERENCES public.perfis_referencia(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_virais_perfil_id ON public.virais(perfil_id);
CREATE POLICY "Admins podem apagar virais" ON public.virais FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));