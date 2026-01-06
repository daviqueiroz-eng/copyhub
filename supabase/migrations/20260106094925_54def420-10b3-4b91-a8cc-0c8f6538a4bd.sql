-- Tabela para salvar tempos dos roteiros
CREATE TABLE public.mentorados_roteiros_tempos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roteiro_id UUID NOT NULL REFERENCES public.mentorados_roteiros(id) ON DELETE CASCADE,
  tempo_segundos INTEGER NOT NULL DEFAULT 0,
  finalizado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mentorados_roteiros_tempos ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view tempo of their roteiros"
ON public.mentorados_roteiros_tempos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.mentorados_roteiros mr
    WHERE mr.id = roteiro_id AND mr.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert tempo for their roteiros"
ON public.mentorados_roteiros_tempos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.mentorados_roteiros mr
    WHERE mr.id = roteiro_id AND mr.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update tempo of their roteiros"
ON public.mentorados_roteiros_tempos
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.mentorados_roteiros mr
    WHERE mr.id = roteiro_id AND mr.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete tempo of their roteiros"
ON public.mentorados_roteiros_tempos
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.mentorados_roteiros mr
    WHERE mr.id = roteiro_id AND mr.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_mentorados_roteiros_tempos_updated_at
BEFORE UPDATE ON public.mentorados_roteiros_tempos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();