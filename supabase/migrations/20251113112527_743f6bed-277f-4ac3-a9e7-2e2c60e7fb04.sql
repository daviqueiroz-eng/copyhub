-- Criar enum para cargo
CREATE TYPE cargo_type AS ENUM ('junior', 'pleno', 'senior');

-- Adicionar campos cargo e pdi na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN cargo cargo_type DEFAULT 'junior',
ADD COLUMN pdi TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.profiles.cargo IS 'Nível de senioridade: junior, pleno ou senior';
COMMENT ON COLUMN public.profiles.pdi IS 'Processo de Desenvolvimento Individual do usuário';

-- Criar bucket de avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false);

-- RLS Policies para bucket avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Tornar avatares públicos para visualização
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');