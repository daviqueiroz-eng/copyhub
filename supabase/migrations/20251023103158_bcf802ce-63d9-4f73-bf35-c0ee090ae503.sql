-- Create table for planilhas (spreadsheets)
CREATE TABLE public.planilhas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  link TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.planilhas ENABLE ROW LEVEL SECURITY;

-- Create policies for full access (since this is internal team tool)
CREATE POLICY "Todos podem visualizar planilhas" 
ON public.planilhas 
FOR SELECT 
USING (true);

CREATE POLICY "Todos podem criar planilhas" 
ON public.planilhas 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Todos podem atualizar planilhas" 
ON public.planilhas 
FOR UPDATE 
USING (true);

CREATE POLICY "Todos podem deletar planilhas" 
ON public.planilhas 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_planilhas_updated_at
BEFORE UPDATE ON public.planilhas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default spreadsheets
INSERT INTO public.planilhas (nome, link, ordem) VALUES
  ('Planilha dos Virais', '#', 1),
  ('Planilha de Headlines', '#', 2);