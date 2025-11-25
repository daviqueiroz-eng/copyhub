-- Adicionar coluna checklist em atividades_gerais
ALTER TABLE atividades_gerais 
ADD COLUMN IF NOT EXISTS checklist jsonb DEFAULT '[]'::jsonb;

-- Comentário explicando a estrutura do checklist
COMMENT ON COLUMN atividades_gerais.checklist IS 'Array de objetos com estrutura: [{"id": "uuid", "texto": "tarefa", "concluida": false}]';