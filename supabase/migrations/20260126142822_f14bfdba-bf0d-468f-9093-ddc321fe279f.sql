-- Tabela de tipos de roteiro
CREATE TABLE IF NOT EXISTS public.tipos_roteiro (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tipos_roteiro ENABLE ROW LEVEL SECURITY;

-- Política: usuário vê/gerencia apenas seus tipos
CREATE POLICY "Users can manage their own tipos_roteiro"
  ON public.tipos_roteiro
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);