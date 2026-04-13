
-- Table for admin-configurable checklist items
CREATE TABLE public.headline_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  label TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.headline_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver itens do checklist"
ON public.headline_checklist_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Apenas admins podem criar itens do checklist"
ON public.headline_checklist_items FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem atualizar itens do checklist"
ON public.headline_checklist_items FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem deletar itens do checklist"
ON public.headline_checklist_items FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Table for user progress on checklist items per headline
CREATE TABLE public.headline_checklist_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentorado_id UUID NOT NULL REFERENCES public.mentorados(id) ON DELETE CASCADE,
  guia_numero INTEGER NOT NULL,
  ordem_roteiro INTEGER NOT NULL,
  checklist_item_id UUID NOT NULL REFERENCES public.headline_checklist_items(id) ON DELETE CASCADE,
  checked BOOLEAN NOT NULL DEFAULT false,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (mentorado_id, guia_numero, ordem_roteiro, checklist_item_id, user_id)
);

ALTER TABLE public.headline_checklist_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio progresso"
ON public.headline_checklist_progress FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seu próprio progresso"
ON public.headline_checklist_progress FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio progresso"
ON public.headline_checklist_progress FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seu próprio progresso"
ON public.headline_checklist_progress FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
