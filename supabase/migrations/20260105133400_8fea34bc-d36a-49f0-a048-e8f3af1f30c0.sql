-- Criar tabela para headlines importadas do Excel
CREATE TABLE public.user_headlines_excel (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  headline TEXT NOT NULL,
  estrutura TEXT,
  arquivo_origem TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_headlines_excel ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own headlines" 
  ON public.user_headlines_excel FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own headlines" 
  ON public.user_headlines_excel FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own headlines" 
  ON public.user_headlines_excel FOR DELETE 
  USING (auth.uid() = user_id);