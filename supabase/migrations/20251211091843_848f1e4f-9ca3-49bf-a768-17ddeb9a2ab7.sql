-- Criar tabela headlines_criadas para armazenar headlines criadas pelos usuários
CREATE TABLE public.headlines_criadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  progresso_id UUID REFERENCES progresso_roteiros(id) ON DELETE CASCADE,
  roteiro_id UUID REFERENCES roteiros(id) ON DELETE SET NULL,
  nicho_id UUID REFERENCES nichos(id) ON DELETE SET NULL,
  headline TEXT NOT NULL,
  estrutura_base TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.headlines_criadas ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver suas próprias headlines
CREATE POLICY "Usuários podem ver suas próprias headlines" 
ON public.headlines_criadas
FOR SELECT 
USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias headlines  
CREATE POLICY "Usuários podem criar suas headlines" 
ON public.headlines_criadas
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Usuários podem deletar suas próprias headlines
CREATE POLICY "Usuários podem deletar suas headlines" 
ON public.headlines_criadas
FOR DELETE 
USING (auth.uid() = user_id);