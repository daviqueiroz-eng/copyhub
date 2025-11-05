-- Add analysis fields to progresso_roteiros table
ALTER TABLE progresso_roteiros
ADD COLUMN estrutura_invisivel TEXT,
ADD COLUMN gatilhos_atencao TEXT,
ADD COLUMN estrutura_roteiro TEXT,
ADD COLUMN sublinhados JSONB DEFAULT '[]'::jsonb;