-- Adicionar coluna mentorado_id na tabela headlines_criadas
ALTER TABLE headlines_criadas 
ADD COLUMN mentorado_id UUID REFERENCES mentorados(id) ON DELETE SET NULL;

-- Criar índice para melhorar performance de consultas
CREATE INDEX idx_headlines_criadas_mentorado ON headlines_criadas(mentorado_id);