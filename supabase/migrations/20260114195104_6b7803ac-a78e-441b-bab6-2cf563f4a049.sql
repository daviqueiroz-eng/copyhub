-- Criar tabela para armazenar feedbacks de roteiros
CREATE TABLE public.roteiro_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mentorado_id UUID NOT NULL REFERENCES public.mentorados(id) ON DELETE CASCADE,
  guia_numero INTEGER NOT NULL,
  
  -- Tempos em minutos
  tempo_headlines INTEGER DEFAULT 0,
  tempo_roteiros INTEGER DEFAULT 0,
  tempo_revisao INTEGER DEFAULT 0,
  
  -- Dificuldades
  dificuldades TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Evitar duplicatas por guia
  UNIQUE (user_id, mentorado_id, guia_numero)
);

-- Habilitar RLS
ALTER TABLE public.roteiro_feedbacks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can insert their own feedbacks"
  ON public.roteiro_feedbacks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedbacks"
  ON public.roteiro_feedbacks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedbacks"
  ON public.roteiro_feedbacks FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their own feedbacks"
  ON public.roteiro_feedbacks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);