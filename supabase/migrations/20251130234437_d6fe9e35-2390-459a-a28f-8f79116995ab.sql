-- Adicionar email admin na whitelist
INSERT INTO public.allowed_emails (email, nome, cadastrado_por, usado)
VALUES ('coreadm@gmail.com', 'Admin Principal', NULL, false)
ON CONFLICT (email) DO NOTHING;

-- Função para garantir que emails específicos sejam admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  allowed_email_record RECORD;
  user_role app_role;
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
  
  -- Determinar role baseado no email
  IF LOWER(NEW.email) = 'coreadm@gmail.com' THEN
    user_role := 'admin'::app_role;
  ELSE
    user_role := 'user'::app_role;
  END IF;
  
  -- Email está permitido, criar profile
  INSERT INTO public.profiles (id, user_id, nome, avatar)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    COALESCE(allowed_email_record.nome, NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Atribuir role (admin para coreadm@gmail.com, user para outros)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  -- Marcar email como usado
  UPDATE public.allowed_emails
  SET usado = true,
      usado_em = now()
  WHERE email = LOWER(NEW.email);
  
  RETURN NEW;
END;
$function$;

-- Se o usuário admin já existe, garantir que tem role admin
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Buscar user_id do admin pelo email na tabela auth.users
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'coreadm@gmail.com';
  
  -- Se encontrou, garantir que tem role admin
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;