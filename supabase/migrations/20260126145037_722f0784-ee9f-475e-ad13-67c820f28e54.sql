-- Add configuration fields to tipos_roteiro table
ALTER TABLE public.tipos_roteiro 
ADD COLUMN IF NOT EXISTS prompt TEXT,
ADD COLUMN IF NOT EXISTS template_estrutura TEXT,
ADD COLUMN IF NOT EXISTS config_extra JSONB DEFAULT '{}';