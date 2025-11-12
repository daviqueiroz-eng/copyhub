-- Tabela de emails permitidos (whitelist)
CREATE TABLE public.allowed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  cadastrado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  usado BOOLEAN DEFAULT false,
  usado_em TIMESTAMPTZ
);

-- Habilitar RLS
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem gerenciar emails permitidos
CREATE POLICY "Apenas admins podem gerenciar emails permitidos"
ON public.allowed_emails
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Todos podem verificar se email está permitido (necessário para validação)
CREATE POLICY "Qualquer um pode verificar se email está permitido"
ON public.allowed_emails
FOR SELECT
USING (true);

-- Substituir a função handle_new_user existente para validar whitelist
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed_email_record RECORD;
BEGIN
  -- Verificar se email está na whitelist
  SELECT * INTO allowed_email_record
  FROM public.allowed_emails
  WHERE email = LOWER(NEW.email)
    AND usado = false;
  
  -- Se email não está permitido, bloquear
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Email não autorizado. Entre em contato com o administrador.'
      USING HINT = 'Este email não foi pré-cadastrado pelo administrador';
  END IF;
  
  -- Email está permitido, criar profile
  INSERT INTO public.profiles (id, user_id, nome, avatar)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    COALESCE(allowed_email_record.nome, NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Atribuir role padrão
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role);
  
  -- Marcar email como usado
  UPDATE public.allowed_emails
  SET usado = true,
      usado_em = now()
  WHERE email = LOWER(NEW.email);
  
  RETURN NEW;
END;
$$;