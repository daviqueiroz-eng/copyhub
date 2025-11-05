-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles são visíveis por todos"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem atualizar seu próprio profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seu próprio profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User roles são visíveis por todos"
  ON public.user_roles FOR SELECT
  USING (true);

-- Create security definer function to check roles (BEFORE using it in policies)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Now create policies that use the function
CREATE POLICY "Apenas admins podem gerenciar roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, nome, avatar)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    NEW.raw_user_meta_data->>'avatar'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role);
  
  RETURN NEW;
END;
$$;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create roteiros table
CREATE TABLE public.roteiros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.roteiros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem visualizar roteiros"
  ON public.roteiros FOR SELECT
  USING (true);

CREATE POLICY "Apenas admins podem gerenciar roteiros"
  ON public.roteiros FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create cores_analise table
CREATE TABLE public.cores_analise (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cores_analise ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem visualizar cores"
  ON public.cores_analise FOR SELECT
  USING (true);

CREATE POLICY "Apenas admins podem gerenciar cores"
  ON public.cores_analise FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create sublinhados_corretos table
CREATE TABLE public.sublinhados_corretos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roteiro_id UUID NOT NULL REFERENCES public.roteiros(id) ON DELETE CASCADE,
  cor_id UUID NOT NULL REFERENCES public.cores_analise(id) ON DELETE CASCADE,
  texto_sublinhado TEXT NOT NULL,
  posicao_inicio INTEGER NOT NULL,
  posicao_fim INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sublinhados_corretos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem visualizar sublinhados corretos"
  ON public.sublinhados_corretos FOR SELECT
  USING (true);

CREATE POLICY "Apenas admins podem gerenciar sublinhados corretos"
  ON public.sublinhados_corretos FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create progresso_roteiros table
CREATE TABLE public.progresso_roteiros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  roteiro_id UUID NOT NULL REFERENCES public.roteiros(id) ON DELETE CASCADE,
  completado BOOLEAN NOT NULL DEFAULT false,
  data_completado TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, roteiro_id)
);

ALTER TABLE public.progresso_roteiros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar seu próprio progresso"
  ON public.progresso_roteiros FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seu próprio progresso"
  ON public.progresso_roteiros FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio progresso"
  ON public.progresso_roteiros FOR UPDATE
  USING (auth.uid() = user_id);

-- Create medalhas table
CREATE TABLE public.medalhas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL,
  icone TEXT NOT NULL,
  roteiros_necessarios INTEGER NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.medalhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem visualizar medalhas"
  ON public.medalhas FOR SELECT
  USING (true);

CREATE POLICY "Apenas admins podem gerenciar medalhas"
  ON public.medalhas FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create medalhas_usuarios table
CREATE TABLE public.medalhas_usuarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  medalha_id UUID NOT NULL REFERENCES public.medalhas(id) ON DELETE CASCADE,
  desbloqueada_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, medalha_id)
);

ALTER TABLE public.medalhas_usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar suas próprias medalhas"
  ON public.medalhas_usuarios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias medalhas"
  ON public.medalhas_usuarios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roteiros_updated_at
  BEFORE UPDATE ON public.roteiros
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cores_analise_updated_at
  BEFORE UPDATE ON public.cores_analise
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();