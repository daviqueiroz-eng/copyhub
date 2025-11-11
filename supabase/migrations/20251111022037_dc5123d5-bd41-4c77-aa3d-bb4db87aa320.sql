-- Criar tabela controle_producao
CREATE TABLE IF NOT EXISTS public.controle_producao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,
  mentorado text NOT NULL,
  quantidade_roteiros text NOT NULL,
  maiores_dificuldades text,
  horas_trabalhadas text NOT NULL,
  plataformas text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Criar índice na coluna data para melhor performance
CREATE INDEX idx_controle_producao_data ON public.controle_producao(data DESC);

-- Habilitar RLS
ALTER TABLE public.controle_producao ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Todos podem visualizar controle de produção"
ON public.controle_producao FOR SELECT
USING (true);

CREATE POLICY "Todos podem criar controle de produção"
ON public.controle_producao FOR INSERT
WITH CHECK (true);

CREATE POLICY "Todos podem atualizar controle de produção"
ON public.controle_producao FOR UPDATE
USING (true);

CREATE POLICY "Todos podem deletar controle de produção"
ON public.controle_producao FOR DELETE
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_controle_producao_updated_at
BEFORE UPDATE ON public.controle_producao
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();