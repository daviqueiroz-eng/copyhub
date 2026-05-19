
CREATE TABLE public.headline_votacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  criado_por uuid NOT NULL,
  mentorado_id uuid NOT NULL,
  guia_numero int NOT NULL,
  ordem int NOT NULL,
  headline_texto text NOT NULL,
  iniciada_em timestamptz NOT NULL DEFAULT now(),
  expira_em timestamptz NOT NULL DEFAULT (now() + interval '3 minutes'),
  encerrada boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.headline_votacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados veem votacoes" ON public.headline_votacoes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Criador insere votacao" ON public.headline_votacoes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = criado_por);
CREATE POLICY "Criador atualiza votacao" ON public.headline_votacoes
  FOR UPDATE TO authenticated USING (auth.uid() = criado_por);
CREATE POLICY "Criador deleta votacao" ON public.headline_votacoes
  FOR DELETE TO authenticated USING (auth.uid() = criado_por);

CREATE TABLE public.headline_votacoes_votos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  votacao_id uuid NOT NULL REFERENCES public.headline_votacoes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  nota int NOT NULL,
  comentario text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (votacao_id, user_id)
);

CREATE OR REPLACE FUNCTION public.validate_headline_voto()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v public.headline_votacoes%ROWTYPE;
BEGIN
  IF NEW.nota < 1 OR NEW.nota > 10 THEN
    RAISE EXCEPTION 'Nota deve estar entre 1 e 10';
  END IF;
  SELECT * INTO v FROM public.headline_votacoes WHERE id = NEW.votacao_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Votação não encontrada';
  END IF;
  IF v.encerrada OR v.expira_em < now() THEN
    RAISE EXCEPTION 'Votação já encerrada';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_headline_voto
BEFORE INSERT ON public.headline_votacoes_votos
FOR EACH ROW EXECUTE FUNCTION public.validate_headline_voto();

ALTER TABLE public.headline_votacoes_votos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados veem votos" ON public.headline_votacoes_votos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuario insere proprio voto" ON public.headline_votacoes_votos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.headline_votacoes_visualizadas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  votacao_id uuid NOT NULL REFERENCES public.headline_votacoes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  visualizada_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (votacao_id, user_id)
);

ALTER TABLE public.headline_votacoes_visualizadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario gerencia suas visualizacoes" ON public.headline_votacoes_visualizadas
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.headline_votacoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.headline_votacoes_votos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.headline_votacoes_visualizadas;

ALTER TABLE public.headline_votacoes REPLICA IDENTITY FULL;
ALTER TABLE public.headline_votacoes_votos REPLICA IDENTITY FULL;
