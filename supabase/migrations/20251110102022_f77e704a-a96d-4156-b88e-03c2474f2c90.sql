-- Criar tabela para ideias e feedbacks
CREATE TABLE public.ideias_melhorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  feedback TEXT NOT NULL,
  imagens TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ideias_melhorias ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode criar uma ideia (mesmo sem estar autenticado)
CREATE POLICY "Qualquer pessoa pode criar ideias"
ON public.ideias_melhorias
FOR INSERT
WITH CHECK (true);

-- Apenas admins podem visualizar todas as ideias
CREATE POLICY "Apenas admins podem visualizar ideias"
ON public.ideias_melhorias
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem atualizar ideias
CREATE POLICY "Apenas admins podem atualizar ideias"
ON public.ideias_melhorias
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem deletar ideias
CREATE POLICY "Apenas admins podem deletar ideias"
ON public.ideias_melhorias
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar trigger para updated_at
CREATE TRIGGER update_ideias_melhorias_updated_at
BEFORE UPDATE ON public.ideias_melhorias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket para imagens de feedback
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-images', 'feedback-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para imagens de feedback
CREATE POLICY "Qualquer pessoa pode fazer upload de imagens de feedback"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'feedback-images');

CREATE POLICY "Imagens de feedback são publicamente acessíveis"
ON storage.objects
FOR SELECT
USING (bucket_id = 'feedback-images');

CREATE POLICY "Apenas admins podem deletar imagens de feedback"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'feedback-images' AND
  has_role(auth.uid(), 'admin'::app_role)
);