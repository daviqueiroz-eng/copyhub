ALTER TABLE public.mentorados 
ADD COLUMN IF NOT EXISTS informacoes_mentorado TEXT,
ADD COLUMN IF NOT EXISTS apresentacao TEXT;