-- Adicionar coluna para destinatários específicos (NULL = todos)
ALTER TABLE atividades_gerais 
ADD COLUMN usuarios_destinatarios uuid[] DEFAULT NULL;

COMMENT ON COLUMN atividades_gerais.usuarios_destinatarios IS 'IDs dos usuários destinatários. NULL = todos os usuários ativos';