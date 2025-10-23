-- Create table for nichos
CREATE TABLE public.nichos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.nichos ENABLE ROW LEVEL SECURITY;

-- Create policies for full access
CREATE POLICY "Todos podem visualizar nichos" 
ON public.nichos 
FOR SELECT 
USING (true);

CREATE POLICY "Todos podem criar nichos" 
ON public.nichos 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Todos podem atualizar nichos" 
ON public.nichos 
FOR UPDATE 
USING (true);

CREATE POLICY "Todos podem deletar nichos" 
ON public.nichos 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_nichos_updated_at
BEFORE UPDATE ON public.nichos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default nichos
INSERT INTO public.nichos (nome) VALUES
  ('Mercado Financeiro'),
  ('Saúde e Bem-Estar'),
  ('Marketing Digital'),
  ('Desenvolvimento Pessoal'),
  ('Empreendedorismo');