-- Permitir que admins vejam todas as tarefas de atividades gerais para acompanhamento
CREATE POLICY "Admins podem ver tarefas de atividades gerais" 
ON flow_tarefas 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND atividade_geral_id IS NOT NULL
);