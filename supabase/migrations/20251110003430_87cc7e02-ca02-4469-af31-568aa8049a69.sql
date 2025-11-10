-- 1. Remover coluna canvas_data da tabela mentorados
ALTER TABLE public.mentorados
DROP COLUMN IF EXISTS canvas_data;

-- 2. Adicionar coluna user_id para vincular mentorado ao usuário criador
ALTER TABLE public.mentorados
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Para mentorados existentes, atribuir ao primeiro usuário admin encontrado
-- (se não houver dados, esta linha não terá efeito)
UPDATE public.mentorados 
SET user_id = (
  SELECT user_id 
  FROM public.user_roles 
  WHERE role = 'admin'::app_role 
  LIMIT 1
)
WHERE user_id IS NULL;

-- 4. Tornar user_id obrigatório
ALTER TABLE public.mentorados
ALTER COLUMN user_id SET NOT NULL;

-- 5. Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_mentorados_user_id ON public.mentorados(user_id);

-- 6. Drop políticas antigas de mentorados (muito permissivas)
DROP POLICY IF EXISTS "Todos podem visualizar mentorados" ON public.mentorados;
DROP POLICY IF EXISTS "Todos podem criar mentorados" ON public.mentorados;
DROP POLICY IF EXISTS "Todos podem atualizar mentorados" ON public.mentorados;
DROP POLICY IF EXISTS "Todos podem deletar mentorados" ON public.mentorados;

-- 7. Criar políticas baseadas em user_id para mentorados
CREATE POLICY "Usuários podem ver apenas seus mentorados"
ON public.mentorados
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios mentorados"
ON public.mentorados
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar apenas seus mentorados"
ON public.mentorados
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar apenas seus mentorados"
ON public.mentorados
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 8. Drop políticas antigas de entregas (também muito permissivas)
DROP POLICY IF EXISTS "Todos podem visualizar entregas" ON public.entregas_mentorados;
DROP POLICY IF EXISTS "Todos podem criar entregas" ON public.entregas_mentorados;
DROP POLICY IF EXISTS "Todos podem atualizar entregas" ON public.entregas_mentorados;
DROP POLICY IF EXISTS "Todos podem deletar entregas" ON public.entregas_mentorados;

-- 9. Criar políticas para entregas baseadas no dono do mentorado
CREATE POLICY "Usuários veem entregas de seus mentorados"
ON public.entregas_mentorados
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.mentorados
    WHERE mentorados.id = entregas_mentorados.mentorado_id
    AND mentorados.user_id = auth.uid()
  )
);

CREATE POLICY "Usuários criam entregas para seus mentorados"
ON public.entregas_mentorados
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.mentorados
    WHERE mentorados.id = entregas_mentorados.mentorado_id
    AND mentorados.user_id = auth.uid()
  )
);

CREATE POLICY "Usuários atualizam entregas de seus mentorados"
ON public.entregas_mentorados
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.mentorados
    WHERE mentorados.id = entregas_mentorados.mentorado_id
    AND mentorados.user_id = auth.uid()
  )
);

CREATE POLICY "Usuários deletam entregas de seus mentorados"
ON public.entregas_mentorados
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.mentorados
    WHERE mentorados.id = entregas_mentorados.mentorado_id
    AND mentorados.user_id = auth.uid()
  )
);

-- 10. Adicionar comentário documentando a segurança
COMMENT ON COLUMN public.mentorados.user_id IS 'ID do usuário criador - garante privacidade via RLS';