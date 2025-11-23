-- Criar tabela de atividades gerais
CREATE TABLE atividades_gerais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL DEFAULT 'geral',
  prioridade TEXT NOT NULL DEFAULT 'media',
  data_limite DATE,
  anexos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_atividades_gerais_updated_at
  BEFORE UPDATE ON atividades_gerais
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE atividades_gerais ENABLE ROW LEVEL SECURITY;

-- Todos podem visualizar atividades gerais
CREATE POLICY "Todos podem visualizar atividades gerais"
  ON atividades_gerais
  FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admins podem criar atividades gerais
CREATE POLICY "Apenas admins podem criar atividades gerais"
  ON atividades_gerais
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem atualizar atividades gerais
CREATE POLICY "Apenas admins podem atualizar atividades gerais"
  ON atividades_gerais
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem deletar atividades gerais
CREATE POLICY "Apenas admins podem deletar atividades gerais"
  ON atividades_gerais
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar tabela para rastrear visualizações
CREATE TABLE atividades_visualizadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  atividade_id UUID NOT NULL REFERENCES atividades_gerais(id) ON DELETE CASCADE,
  visualizada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, atividade_id)
);

-- RLS Policies para atividades_visualizadas
ALTER TABLE atividades_visualizadas ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver suas próprias visualizações
CREATE POLICY "Usuários podem ver suas visualizações"
  ON atividades_visualizadas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Usuários podem inserir suas próprias visualizações
CREATE POLICY "Usuários podem inserir suas visualizações"
  ON atividades_visualizadas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins podem ver todas as visualizações
CREATE POLICY "Admins podem ver todas visualizações"
  ON atividades_visualizadas
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));