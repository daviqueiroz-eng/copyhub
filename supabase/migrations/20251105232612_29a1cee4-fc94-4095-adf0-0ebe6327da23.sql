-- Adicionar campos para roteiros privados/públicos
ALTER TABLE roteiros 
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN is_private boolean NOT NULL DEFAULT false;

-- Criar índice para melhorar performance
CREATE INDEX idx_roteiros_user_private ON roteiros(user_id, is_private);

-- Comentar os campos
COMMENT ON COLUMN roteiros.user_id IS 'ID do usuário que criou o roteiro (NULL = roteiro público criado por admin)';
COMMENT ON COLUMN roteiros.is_private IS 'Indica se o roteiro é privado (true) ou público (false)';

-- Remover a política antiga de SELECT
DROP POLICY IF EXISTS "Todos podem visualizar roteiros" ON roteiros;

-- Criar nova política de SELECT que diferencia público vs privado
CREATE POLICY "Usuários podem ver roteiros públicos e seus próprios privados"
ON roteiros
FOR SELECT
TO authenticated
USING (
  -- Roteiros públicos (criados por admin, sem user_id ou is_private = false)
  (is_private = false OR user_id IS NULL)
  OR
  -- Roteiros privados do próprio usuário
  (is_private = true AND user_id = auth.uid())
);