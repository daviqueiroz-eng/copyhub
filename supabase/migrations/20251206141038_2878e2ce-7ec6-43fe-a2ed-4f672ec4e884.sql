-- Criar tabela para armazenar imports do Trello
CREATE TABLE public.trello_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  nome_arquivo TEXT NOT NULL,
  dados JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trello_imports ENABLE ROW LEVEL SECURITY;

-- Todos podem visualizar imports
CREATE POLICY "Todos podem visualizar imports"
ON public.trello_imports
FOR SELECT
USING (true);

-- Apenas admins podem criar imports
CREATE POLICY "Apenas admins podem criar imports"
ON public.trello_imports
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem atualizar imports
CREATE POLICY "Apenas admins podem atualizar imports"
ON public.trello_imports
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem deletar imports
CREATE POLICY "Apenas admins podem deletar imports"
ON public.trello_imports
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_trello_imports_updated_at
BEFORE UPDATE ON public.trello_imports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();