-- Tabela para persistir roteiros de Overdelivery
CREATE TABLE public.mentorados_roteiros_overdelivery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mentorado_id uuid NOT NULL REFERENCES public.mentorados(id) ON DELETE CASCADE,
  guia_numero integer NOT NULL,
  bloco_id text NOT NULL,
  bloco_titulo text NOT NULL DEFAULT 'Bloco 1',
  bloco_ordem integer NOT NULL DEFAULT 1,
  roteiro_ordem integer NOT NULL DEFAULT 1,
  headline text DEFAULT '',
  estrutura text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_overdelivery_user ON public.mentorados_roteiros_overdelivery(user_id);
CREATE INDEX idx_overdelivery_mentorado_guia ON public.mentorados_roteiros_overdelivery(mentorado_id, guia_numero);
CREATE INDEX idx_overdelivery_bloco ON public.mentorados_roteiros_overdelivery(bloco_id);

-- Enable RLS
ALTER TABLE public.mentorados_roteiros_overdelivery ENABLE ROW LEVEL SECURITY;

-- Policy: usuários só podem gerenciar seus próprios dados
CREATE POLICY "Users can manage own overdelivery"
ON public.mentorados_roteiros_overdelivery
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_overdelivery_updated_at
  BEFORE UPDATE ON public.mentorados_roteiros_overdelivery
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();