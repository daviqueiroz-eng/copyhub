ALTER TABLE mentorados_roteiros 
ADD COLUMN tipo_roteiro_id uuid REFERENCES tipos_roteiro(id) ON DELETE SET NULL;