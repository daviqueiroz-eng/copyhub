-- Add columns for custom guide names and order
ALTER TABLE mentorados_guias_config 
ADD COLUMN IF NOT EXISTS nome_customizado TEXT,
ADD COLUMN IF NOT EXISTS ordem_personalizada INTEGER;

-- Initialize ordem_personalizada with the guide number
UPDATE mentorados_guias_config 
SET ordem_personalizada = numero 
WHERE ordem_personalizada IS NULL;