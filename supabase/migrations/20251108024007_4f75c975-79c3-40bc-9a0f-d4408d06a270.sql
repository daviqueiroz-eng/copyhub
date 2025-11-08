-- Create storage bucket for treinamento thumbnails
INSERT INTO storage.buckets (id, name, public) 
VALUES ('treinamento-thumbnails', 'treinamento-thumbnails', true);

-- Create policies for treinamento thumbnails
CREATE POLICY "Thumbnails são publicamente acessíveis" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'treinamento-thumbnails');

CREATE POLICY "Admins podem fazer upload de thumbnails" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'treinamento-thumbnails' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins podem atualizar thumbnails" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'treinamento-thumbnails' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins podem deletar thumbnails" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'treinamento-thumbnails' 
  AND has_role(auth.uid(), 'admin'::app_role)
);