-- Criar tabela de mentorados para controle de produção
CREATE TABLE IF NOT EXISTS public.mentorados_controle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Criar índice para ordenação
CREATE INDEX idx_mentorados_controle_ordem ON public.mentorados_controle(ordem);

-- Habilitar RLS
ALTER TABLE public.mentorados_controle ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Todos podem visualizar mentorados"
ON public.mentorados_controle FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Todos podem criar mentorados"
ON public.mentorados_controle FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Todos podem atualizar mentorados"
ON public.mentorados_controle FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Todos podem deletar mentorados"
ON public.mentorados_controle FOR DELETE
TO authenticated
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_mentorados_controle_updated_at
BEFORE UPDATE ON public.mentorados_controle
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Inserir os mentorados iniciais
INSERT INTO public.mentorados_controle (nome, ordem) VALUES
  ('Jhay', 1),
  ('Leandro', 2),
  ('Mariah', 3),
  ('Felipe', 4),
  ('Junior', 5),
  ('Rafael', 6),
  ('Vinicius', 7),
  ('Pedro', 8),
  ('Rafael Nunes', 9),
  ('Juliano', 10),
  ('Gabriel', 11),
  ('Sergio', 12),
  ('Davi', 13),
  ('Yuri', 14),
  ('Joyce Felipe', 15),
  ('Deivid', 16);