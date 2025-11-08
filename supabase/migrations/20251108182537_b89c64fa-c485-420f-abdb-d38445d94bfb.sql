-- Criar tabela de entregas dos mentorados
CREATE TABLE public.entregas_mentorados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentorado_id UUID NOT NULL REFERENCES public.mentorados(id) ON DELETE CASCADE,
  numero_leva INTEGER NOT NULL CHECK (numero_leva >= 1 AND numero_leva <= 6),
  data_entrega DATE,
  concluida BOOLEAN NOT NULL DEFAULT false,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mentorado_id, numero_leva)
);

-- Habilitar RLS
ALTER TABLE public.entregas_mentorados ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Todos podem visualizar entregas"
ON public.entregas_mentorados
FOR SELECT
USING (true);

CREATE POLICY "Todos podem criar entregas"
ON public.entregas_mentorados
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Todos podem atualizar entregas"
ON public.entregas_mentorados
FOR UPDATE
USING (true);

CREATE POLICY "Todos podem deletar entregas"
ON public.entregas_mentorados
FOR DELETE
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_entregas_mentorados_updated_at
BEFORE UPDATE ON public.entregas_mentorados
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();