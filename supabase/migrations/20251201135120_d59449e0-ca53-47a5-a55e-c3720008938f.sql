-- Remover trigger que duplica a criação de tarefas (nome correto do trigger)
DROP TRIGGER IF EXISTS trigger_criar_tarefas_atividade_geral ON atividades_gerais;

-- Remover função associada ao trigger com CASCADE
DROP FUNCTION IF EXISTS criar_tarefas_para_atividade_geral() CASCADE;