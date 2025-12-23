-- Criar tabela para roteiros de mentorados organizados por guias
CREATE TABLE public.mentorados_roteiros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentorado_id UUID NOT NULL REFERENCES public.mentorados(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  guia_numero INTEGER NOT NULL DEFAULT 1,
  ordem INTEGER NOT NULL,
  headline TEXT DEFAULT '',
  estrutura TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mentorado_id, guia_numero, ordem)
);

-- Enable RLS
ALTER TABLE public.mentorados_roteiros ENABLE ROW LEVEL SECURITY;

-- Policies: usuários podem gerenciar apenas seus próprios roteiros
CREATE POLICY "Usuários podem ver seus roteiros" 
ON public.mentorados_roteiros 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus roteiros" 
ON public.mentorados_roteiros 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus roteiros" 
ON public.mentorados_roteiros 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus roteiros" 
ON public.mentorados_roteiros 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_mentorados_roteiros_updated_at
BEFORE UPDATE ON public.mentorados_roteiros
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();