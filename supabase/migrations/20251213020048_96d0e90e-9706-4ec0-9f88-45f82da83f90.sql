-- Add viral goal columns to grupos table
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS meta_primeira_viral INTEGER DEFAULT 0;
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS meta_viral_constante INTEGER DEFAULT 0;

-- Create table for tracking virals per member
CREATE TABLE grupos_membros_virais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membro_id UUID NOT NULL REFERENCES grupos_membros(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('primeira_viral', 'viral_constante')),
  quantidade INTEGER NOT NULL DEFAULT 1,
  data_registro DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE grupos_membros_virais ENABLE ROW LEVEL SECURITY;

-- Policy: Members can view virals in their group
CREATE POLICY "Ver virais do grupo"
ON grupos_membros_virais FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM grupos_membros gm
    JOIN grupos g ON g.id = gm.grupo_id
    WHERE gm.id = grupos_membros_virais.membro_id
    AND (g.created_by = auth.uid() OR is_grupo_member(auth.uid(), g.id))
  )
);

-- Policy: Members can manage their own virals
CREATE POLICY "Gerenciar próprios virais"
ON grupos_membros_virais FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM grupos_membros gm
    WHERE gm.id = grupos_membros_virais.membro_id
    AND gm.user_id = auth.uid()
  )
);

-- Policy: Group creator can manage all virals
CREATE POLICY "Criador gerencia virais"
ON grupos_membros_virais FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM grupos_membros gm
    JOIN grupos g ON g.id = gm.grupo_id
    WHERE gm.id = grupos_membros_virais.membro_id
    AND g.created_by = auth.uid()
  )
);