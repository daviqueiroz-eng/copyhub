-- Create inteligencia_global table for admin-defined global intelligence
CREATE TABLE public.inteligencia_global (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL DEFAULT 'Método Principal',
  conteudo TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inteligencia_global ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active intelligence
CREATE POLICY "Authenticated users can read inteligencia_global"
  ON public.inteligencia_global FOR SELECT
  TO authenticated USING (ativo = true);

-- Admins can manage all intelligence
CREATE POLICY "Admins can manage inteligencia_global"
  ON public.inteligencia_global FOR ALL
  TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Add inteligencia_ia column to mentorados table
ALTER TABLE public.mentorados
ADD COLUMN inteligencia_ia TEXT;

COMMENT ON COLUMN public.mentorados.inteligencia_ia IS 
'Inteligência para IA: nicho, público-alvo, produto, tom de voz do mentorado';