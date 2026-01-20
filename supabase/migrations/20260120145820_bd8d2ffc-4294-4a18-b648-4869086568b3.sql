-- Adicionar coluna is_global para marcar headlines compartilhadas
ALTER TABLE public.user_headlines_excel 
ADD COLUMN is_global BOOLEAN NOT NULL DEFAULT false;

-- Dropar política antiga de SELECT
DROP POLICY IF EXISTS "Users can view own headlines" ON public.user_headlines_excel;

-- Nova política: usuários podem ver próprias headlines OU headlines globais
CREATE POLICY "Users can view own or global headlines"
ON public.user_headlines_excel FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR is_global = true
);

-- Adicionar política para admins poderem atualizar headlines (para setar is_global)
CREATE POLICY "Admins can update headlines"
ON public.user_headlines_excel FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);