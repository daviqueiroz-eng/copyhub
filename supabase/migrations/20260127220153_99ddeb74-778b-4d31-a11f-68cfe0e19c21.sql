-- Criar tabela para tipos de chat de revisão
CREATE TABLE public.tipos_chat_revisao (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  descricao text,
  prompt_sistema text,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tipos_chat_revisao ENABLE ROW LEVEL SECURITY;

-- Política para ver próprios tipos
CREATE POLICY "Usuários podem ver seus tipos de chat"
  ON public.tipos_chat_revisao FOR SELECT
  USING (auth.uid() = user_id);

-- Política para criar tipos
CREATE POLICY "Usuários podem criar tipos de chat"
  ON public.tipos_chat_revisao FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para atualizar tipos
CREATE POLICY "Usuários podem atualizar seus tipos de chat"
  ON public.tipos_chat_revisao FOR UPDATE
  USING (auth.uid() = user_id);

-- Política para deletar tipos
CREATE POLICY "Usuários podem deletar seus tipos de chat"
  ON public.tipos_chat_revisao FOR DELETE
  USING (auth.uid() = user_id);