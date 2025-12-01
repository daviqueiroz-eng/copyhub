-- Corrigir política de UPDATE para permitir drag & drop
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias tarefas" ON flow_tarefas;

CREATE POLICY "Usuários podem atualizar suas próprias tarefas" 
ON flow_tarefas 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Adicionar foreign key para permitir join automático com profiles
ALTER TABLE flow_tarefas 
ADD CONSTRAINT flow_tarefas_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Garantir que a política de SELECT para admins existe
DROP POLICY IF EXISTS "Admins podem ver tarefas de atividades gerais" ON flow_tarefas;

CREATE POLICY "Admins podem ver tarefas de atividades gerais" 
ON flow_tarefas 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND atividade_geral_id IS NOT NULL
);