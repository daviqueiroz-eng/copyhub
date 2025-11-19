-- Drop da política restritiva atual
DROP POLICY IF EXISTS "Usuários podem visualizar seu próprio progresso" ON public.progresso_roteiros;

-- Política 1: Todos podem ver progressos completados (para o ranking)
CREATE POLICY "Todos podem visualizar progressos completados"
ON public.progresso_roteiros
FOR SELECT
TO authenticated
USING (completado = true);

-- Política 2: Usuários podem ver todos os seus próprios progressos
CREATE POLICY "Usuários podem ver todos os seus próprios progressos"
ON public.progresso_roteiros
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);