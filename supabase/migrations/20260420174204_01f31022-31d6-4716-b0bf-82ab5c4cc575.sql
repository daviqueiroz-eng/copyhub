-- Tabela de anotações por roteiro
CREATE TABLE public.mentorados_roteiros_anotacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roteiro_id UUID NOT NULL REFERENCES public.mentorados_roteiros(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  referencia_texto TEXT DEFAULT '',
  notas TEXT DEFAULT '',
  estudos TEXT DEFAULT '',
  comentario TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(roteiro_id)
);

ALTER TABLE public.mentorados_roteiros_anotacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas anotações"
  ON public.mentorados_roteiros_anotacoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas anotações"
  ON public.mentorados_roteiros_anotacoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas anotações"
  ON public.mentorados_roteiros_anotacoes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas anotações"
  ON public.mentorados_roteiros_anotacoes FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_mentorados_roteiros_anotacoes_updated_at
  BEFORE UPDATE ON public.mentorados_roteiros_anotacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_anotacoes_roteiro_id ON public.mentorados_roteiros_anotacoes(roteiro_id);
CREATE INDEX idx_anotacoes_user_id ON public.mentorados_roteiros_anotacoes(user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.mentorados_roteiros_anotacoes;
ALTER TABLE public.mentorados_roteiros_anotacoes REPLICA IDENTITY FULL;

-- Tabela de adjetivos poderosos (compartilhada)
CREATE TABLE public.adjetivos_poderosos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  texto TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('positivo', 'negativo')),
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.adjetivos_poderosos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver adjetivos"
  ON public.adjetivos_poderosos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Todos autenticados podem criar adjetivos"
  ON public.adjetivos_poderosos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Todos autenticados podem deletar adjetivos"
  ON public.adjetivos_poderosos FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX idx_adjetivos_tipo ON public.adjetivos_poderosos(tipo);