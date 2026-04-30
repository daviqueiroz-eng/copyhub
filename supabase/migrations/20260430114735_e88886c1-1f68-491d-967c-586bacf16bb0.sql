-- Tabela principal de virais
CREATE TABLE public.virais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  estrutura TEXT,
  formato TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  link TEXT NOT NULL,
  nicho_id UUID REFERENCES public.nichos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_virais_user_id ON public.virais(user_id);
CREATE INDEX idx_virais_nicho_id ON public.virais(nicho_id);
CREATE INDEX idx_virais_created_at ON public.virais(created_at DESC);
CREATE INDEX idx_virais_views ON public.virais(views DESC);

-- RLS
ALTER TABLE public.virais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver virais"
  ON public.virais FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Autenticados podem criar virais próprios"
  ON public.virais FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Apenas autor pode editar viral"
  ON public.virais FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Sem política de DELETE: ninguém pode excluir.

-- Trigger updated_at
CREATE TRIGGER virais_updated_at
  BEFORE UPDATE ON public.virais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime
ALTER TABLE public.virais REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.virais;