-- Criar tabela para fotos de celebração
CREATE TABLE public.fotos_celebracao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.fotos_celebracao ENABLE ROW LEVEL SECURITY;

-- Todos podem visualizar fotos
CREATE POLICY "Todos podem visualizar fotos de celebração"
ON public.fotos_celebracao
FOR SELECT
USING (true);

-- Apenas admins podem criar fotos
CREATE POLICY "Apenas admins podem criar fotos de celebração"
ON public.fotos_celebracao
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem deletar fotos
CREATE POLICY "Apenas admins podem deletar fotos de celebração"
ON public.fotos_celebracao
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar bucket de storage para fotos de celebração
INSERT INTO storage.buckets (id, name, public) VALUES ('fotos-celebracao', 'fotos-celebracao', true);

-- Políticas de storage - todos podem ver
CREATE POLICY "Fotos de celebração são públicas"
ON storage.objects
FOR SELECT
USING (bucket_id = 'fotos-celebracao');

-- Admins podem fazer upload
CREATE POLICY "Admins podem fazer upload de fotos de celebração"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'fotos-celebracao' AND has_role(auth.uid(), 'admin'::app_role));

-- Admins podem deletar
CREATE POLICY "Admins podem deletar fotos de celebração"
ON storage.objects
FOR DELETE
USING (bucket_id = 'fotos-celebracao' AND has_role(auth.uid(), 'admin'::app_role));