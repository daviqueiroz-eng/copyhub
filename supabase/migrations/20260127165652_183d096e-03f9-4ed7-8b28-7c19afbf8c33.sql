-- Create table for adjustment types
CREATE TABLE public.tipos_ajuste (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  instrucoes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tipos_ajuste ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own adjustment types" 
ON public.tipos_ajuste 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own adjustment types" 
ON public.tipos_ajuste 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own adjustment types" 
ON public.tipos_ajuste 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own adjustment types" 
ON public.tipos_ajuste 
FOR DELETE 
USING (auth.uid() = user_id);