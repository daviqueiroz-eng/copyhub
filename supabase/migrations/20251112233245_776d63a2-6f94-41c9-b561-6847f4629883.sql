-- Adicionar coluna ativo na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

-- Criar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_profiles_ativo ON public.profiles(ativo);

-- Criar função para verificar se usuário está ativo
CREATE OR REPLACE FUNCTION public.is_user_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT ativo FROM public.profiles WHERE user_id = _user_id),
    false
  )
$$;

-- Atualizar políticas RLS existentes para considerar status ativo
-- Política para profiles
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio profile" ON public.profiles;
CREATE POLICY "Usuários podem atualizar seu próprio profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id AND is_user_active(auth.uid()));

-- Atualizar usuários existentes como ativos
UPDATE public.profiles SET ativo = true WHERE ativo IS NULL;