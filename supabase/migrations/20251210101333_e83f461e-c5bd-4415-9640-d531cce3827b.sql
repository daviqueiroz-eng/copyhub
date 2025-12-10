-- Create table for system updates
CREATE TABLE public.atualizacoes_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  versao TEXT,
  tipo TEXT NOT NULL DEFAULT 'feature',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ativo BOOLEAN NOT NULL DEFAULT true
);

-- Create table to track read updates per user
CREATE TABLE public.atualizacoes_lidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atualizacao_id UUID NOT NULL REFERENCES public.atualizacoes_sistema(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  lida_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(atualizacao_id, user_id)
);

-- Enable RLS
ALTER TABLE public.atualizacoes_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atualizacoes_lidas ENABLE ROW LEVEL SECURITY;

-- RLS for atualizacoes_sistema
CREATE POLICY "Todos podem visualizar atualizações ativas"
ON public.atualizacoes_sistema
FOR SELECT
USING (ativo = true);

CREATE POLICY "Apenas admins podem gerenciar atualizações"
ON public.atualizacoes_sistema
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS for atualizacoes_lidas
CREATE POLICY "Usuários podem ver suas próprias leituras"
ON public.atualizacoes_lidas
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem marcar como lida"
ON public.atualizacoes_lidas
FOR INSERT
WITH CHECK (auth.uid() = user_id);