-- Criar bucket para thumbnails de aulas
INSERT INTO storage.buckets (id, name, public)
VALUES ('aula-thumbnails', 'aula-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Adicionar coluna thumbnail_url na tabela aulas
ALTER TABLE public.aulas
ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Políticas de acesso para o bucket de aula-thumbnails
CREATE POLICY "Thumbnails de aulas são publicamente acessíveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'aula-thumbnails');

CREATE POLICY "Apenas admins podem fazer upload de thumbnails de aulas"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'aula-thumbnails' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Apenas admins podem atualizar thumbnails de aulas"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'aula-thumbnails' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Apenas admins podem deletar thumbnails de aulas"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'aula-thumbnails' 
  AND has_role(auth.uid(), 'admin'::app_role)
);