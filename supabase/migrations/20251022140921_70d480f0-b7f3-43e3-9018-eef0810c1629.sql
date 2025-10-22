-- Criar tabela de categorias
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de headlines
CREATE TABLE public.headlines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_key TEXT NOT NULL REFERENCES public.categories(key) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  referencia TEXT,
  gatilhos TEXT,
  estrutura TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.headlines ENABLE ROW LEVEL SECURITY;

-- Políticas para categorias (todos podem ler e escrever por enquanto)
CREATE POLICY "Todos podem visualizar categorias"
  ON public.categories
  FOR SELECT
  USING (true);

CREATE POLICY "Todos podem criar categorias"
  ON public.categories
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Todos podem atualizar categorias"
  ON public.categories
  FOR UPDATE
  USING (true);

CREATE POLICY "Todos podem deletar categorias"
  ON public.categories
  FOR DELETE
  USING (true);

-- Políticas para headlines (todos podem ler e escrever por enquanto)
CREATE POLICY "Todos podem visualizar headlines"
  ON public.headlines
  FOR SELECT
  USING (true);

CREATE POLICY "Todos podem criar headlines"
  ON public.headlines
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Todos podem atualizar headlines"
  ON public.headlines
  FOR UPDATE
  USING (true);

CREATE POLICY "Todos podem deletar headlines"
  ON public.headlines
  FOR DELETE
  USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_headlines_updated_at
  BEFORE UPDATE ON public.headlines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir categorias iniciais
INSERT INTO public.categories (name, key) VALUES
  ('Comunicação', 'comunicacao'),
  ('Cristão', 'cristao'),
  ('Ginecologista/Obstetro', 'gineocologista'),
  ('Espiritualidade', 'espiritualidade'),
  ('Medicina', 'medicina'),
  ('Psicologia', 'psicologia'),
  ('Saúde e emagrecimento', 'saude'),
  ('Criação de filhos', 'filhos');