-- Criar tabela para biblioteca de músicas/vídeos do Pomodoro
CREATE TABLE public.flow_biblioteca_musicas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.flow_biblioteca_musicas ENABLE ROW LEVEL SECURITY;

-- Políticas: todos podem ler, apenas admins podem criar/atualizar/deletar
CREATE POLICY "Todos podem visualizar músicas da biblioteca"
ON public.flow_biblioteca_musicas
FOR SELECT
USING (true);

CREATE POLICY "Apenas admins podem criar músicas"
ON public.flow_biblioteca_musicas
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Apenas admins podem atualizar músicas"
ON public.flow_biblioteca_musicas
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Apenas admins podem deletar músicas"
ON public.flow_biblioteca_musicas
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_flow_biblioteca_musicas_updated_at
BEFORE UPDATE ON public.flow_biblioteca_musicas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índice para melhor performance
CREATE INDEX idx_flow_biblioteca_musicas_created_at ON public.flow_biblioteca_musicas(created_at DESC);

COMMENT ON TABLE public.flow_biblioteca_musicas IS 'Biblioteca de músicas/vídeos do YouTube para o Pomodoro Timer';
COMMENT ON COLUMN public.flow_biblioteca_musicas.titulo IS 'Título da música/vídeo';
COMMENT ON COLUMN public.flow_biblioteca_musicas.youtube_url IS 'URL completa do vídeo do YouTube';