-- Remover a política antiga de inserção
DROP POLICY IF EXISTS "Usuários podem criar suas próprias tarefas" ON flow_tarefas;

-- Criar nova política que permite usuários criarem suas próprias tarefas normais
CREATE POLICY "Usuários podem criar suas próprias tarefas normais" 
ON flow_tarefas 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND atividade_geral_id IS NULL
);

-- Permitir que admins criem tarefas de atividades gerais para outros usuários
CREATE POLICY "Admins podem criar tarefas de atividades gerais" 
ON flow_tarefas 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND atividade_geral_id IS NOT NULL
);

-- Também permitir que o trigger automático crie tarefas (via SECURITY DEFINER function)
CREATE POLICY "Sistema pode criar tarefas de atividades gerais" 
ON flow_tarefas 
FOR INSERT 
WITH CHECK (
  atividade_geral_id IS NOT NULL
);