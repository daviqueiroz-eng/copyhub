-- Create prompts table
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  nicho TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  comentarios TEXT,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view prompts
CREATE POLICY "Todos podem visualizar prompts"
  ON public.prompts
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can manage prompts
CREATE POLICY "Apenas admins podem gerenciar prompts"
  ON public.prompts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prompts_titulo ON public.prompts(titulo);
CREATE INDEX IF NOT EXISTS idx_prompts_nicho ON public.prompts(nicho);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON public.prompts(created_at DESC);