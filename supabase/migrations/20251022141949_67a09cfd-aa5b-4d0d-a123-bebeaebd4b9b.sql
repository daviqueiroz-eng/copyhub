-- Criar tabela de mentorados
CREATE TABLE public.mentorados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  iniciais TEXT NOT NULL,
  avatar TEXT,
  dores TEXT,
  desejos TEXT,
  objecoes TEXT,
  crencas TEXT,
  plano TEXT,
  estilo_comum TEXT,
  roteiros TEXT,
  observacoes TEXT,
  links_chats TEXT,
  link_drive TEXT,
  referencias TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.mentorados ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (todos podem ler e escrever por enquanto)
CREATE POLICY "Todos podem visualizar mentorados"
  ON public.mentorados
  FOR SELECT
  USING (true);

CREATE POLICY "Todos podem criar mentorados"
  ON public.mentorados
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Todos podem atualizar mentorados"
  ON public.mentorados
  FOR UPDATE
  USING (true);

CREATE POLICY "Todos podem deletar mentorados"
  ON public.mentorados
  FOR DELETE
  USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_mentorados_updated_at
  BEFORE UPDATE ON public.mentorados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();