-- Adicionar política RLS para admins editarem profiles de outros usuários
CREATE POLICY "Admins podem atualizar qualquer profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));