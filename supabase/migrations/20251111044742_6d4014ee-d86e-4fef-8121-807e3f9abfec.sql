-- Adicionar política RLS de DELETE para progresso_roteiros
CREATE POLICY "Usuários podem deletar seu próprio progresso"
ON progresso_roteiros
FOR DELETE
USING (auth.uid() = user_id);

-- Remover constraint UNIQUE para permitir múltiplas análises do mesmo roteiro
ALTER TABLE progresso_roteiros 
DROP CONSTRAINT IF EXISTS progresso_roteiros_user_id_roteiro_id_key;