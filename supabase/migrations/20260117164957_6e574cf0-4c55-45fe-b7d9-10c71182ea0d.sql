-- Tabela para configuração das guias (persistir isOverdelivery)
CREATE TABLE mentorados_guias_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mentorado_id uuid NOT NULL REFERENCES mentorados(id) ON DELETE CASCADE,
  numero integer NOT NULL,
  quantidade integer NOT NULL DEFAULT 10,
  is_overdelivery boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, mentorado_id, numero)
);

-- Índices para performance
CREATE INDEX idx_guias_config_user ON mentorados_guias_config(user_id);
CREATE INDEX idx_guias_config_mentorado ON mentorados_guias_config(mentorado_id);

-- Habilitar RLS
ALTER TABLE mentorados_guias_config ENABLE ROW LEVEL SECURITY;

-- Política para usuários gerenciarem suas próprias configs
CREATE POLICY "Users can manage own guias config"
ON mentorados_guias_config
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_guias_config_updated_at
  BEFORE UPDATE ON mentorados_guias_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();