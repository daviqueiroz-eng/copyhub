-- Create treinamentos table
CREATE TABLE treinamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text NOT NULL,
  thumbnail_url text,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE treinamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem visualizar treinamentos"
ON treinamentos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Apenas admins podem gerenciar treinamentos"
ON treinamentos FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_treinamentos_ordem ON treinamentos(ordem);

-- Create modulos table
CREATE TABLE modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treinamento_id uuid NOT NULL REFERENCES treinamentos(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE modulos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem visualizar modulos"
ON modulos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Apenas admins podem gerenciar modulos"
ON modulos FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_modulos_treinamento ON modulos(treinamento_id);
CREATE INDEX idx_modulos_ordem ON modulos(ordem);

-- Create aulas table
CREATE TABLE aulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id uuid NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text NOT NULL,
  youtube_url text NOT NULL,
  conteudo text,
  duracao text,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem visualizar aulas"
ON aulas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Apenas admins podem gerenciar aulas"
ON aulas FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_aulas_modulo ON aulas(modulo_id);
CREATE INDEX idx_aulas_ordem ON aulas(ordem);

-- Create comentarios_aulas table
CREATE TABLE comentarios_aulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id uuid NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comentario text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE comentarios_aulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem visualizar comentarios"
ON comentarios_aulas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios podem criar comentarios"
ON comentarios_aulas FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios podem editar seus comentarios"
ON comentarios_aulas FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios podem deletar seus comentarios"
ON comentarios_aulas FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins podem deletar comentarios"
ON comentarios_aulas FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_comentarios_aula ON comentarios_aulas(aula_id);
CREATE INDEX idx_comentarios_user ON comentarios_aulas(user_id);

-- Create progresso_aulas table
CREATE TABLE progresso_aulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id uuid NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concluido boolean NOT NULL DEFAULT false,
  data_conclusao timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(aula_id, user_id)
);

ALTER TABLE progresso_aulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem ver seu progresso"
ON progresso_aulas FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios podem gerenciar seu progresso"
ON progresso_aulas FOR ALL
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_progresso_aula ON progresso_aulas(aula_id);
CREATE INDEX idx_progresso_user ON progresso_aulas(user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_treinamentos_updated_at
  BEFORE UPDATE ON treinamentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modulos_updated_at
  BEFORE UPDATE ON modulos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aulas_updated_at
  BEFORE UPDATE ON aulas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comentarios_aulas_updated_at
  BEFORE UPDATE ON comentarios_aulas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progresso_aulas_updated_at
  BEFORE UPDATE ON progresso_aulas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();