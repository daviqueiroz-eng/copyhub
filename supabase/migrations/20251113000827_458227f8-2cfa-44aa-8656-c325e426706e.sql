-- Atualizar política RLS para profiles incluindo verificação de usuário ativo
DROP POLICY IF EXISTS "Usuários podem ver seu próprio profile" ON public.profiles;

CREATE POLICY "Usuários podem ver seu próprio profile" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id 
  AND is_user_active(auth.uid())
);

-- Criar política para bloquear todas as operações de usuários inativos
CREATE POLICY "Bloquear operações de usuários inativos" 
ON public.profiles 
FOR ALL 
USING (is_user_active(auth.uid()));