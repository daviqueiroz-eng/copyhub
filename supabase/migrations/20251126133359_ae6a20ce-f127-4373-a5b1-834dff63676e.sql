-- Adicionar coluna visualizacoes
ALTER TABLE roteiros 
ADD COLUMN visualizacoes text;

-- Remover a policy ALL antiga para admins e criar policies mais específicas
DROP POLICY IF EXISTS "Apenas admins podem gerenciar roteiros" ON roteiros;

-- 1. Admins podem fazer tudo
CREATE POLICY "Admins podem gerenciar todos roteiros"
ON roteiros FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Usuários podem criar roteiros PRIVADOS (apenas para si mesmos)
CREATE POLICY "Usuários podem criar roteiros privados"
ON roteiros FOR INSERT
TO authenticated
WITH CHECK (
  is_private = true AND user_id = auth.uid()
);

-- 3. Usuários podem atualizar SEUS roteiros privados
CREATE POLICY "Usuários podem atualizar seus roteiros privados"
ON roteiros FOR UPDATE
TO authenticated
USING (is_private = true AND user_id = auth.uid())
WITH CHECK (is_private = true AND user_id = auth.uid());

-- 4. Usuários podem deletar SEUS roteiros privados
CREATE POLICY "Usuários podem deletar seus roteiros privados"
ON roteiros FOR DELETE
TO authenticated
USING (is_private = true AND user_id = auth.uid());