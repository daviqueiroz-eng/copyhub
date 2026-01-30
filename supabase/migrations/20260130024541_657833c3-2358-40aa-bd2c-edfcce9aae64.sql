-- Tabela para armazenar os checks do roteiro viral
CREATE TABLE public.check_roteiro_viral (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  regra_tipo TEXT NOT NULL DEFAULT 'contem',
  regra_valor TEXT,
  campo TEXT NOT NULL DEFAULT 'estrutura',
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS: Todos podem ler, apenas admin pode modificar
ALTER TABLE public.check_roteiro_viral ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver checks"
  ON public.check_roteiro_viral FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Apenas admin pode criar checks"
  ON public.check_roteiro_viral FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode atualizar checks"
  ON public.check_roteiro_viral FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode deletar checks"
  ON public.check_roteiro_viral FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));