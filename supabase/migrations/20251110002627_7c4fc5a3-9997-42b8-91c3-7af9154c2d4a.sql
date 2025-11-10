-- Adicionar campo canvas_data para armazenar o estado do canvas Tldraw
ALTER TABLE public.mentorados
ADD COLUMN canvas_data jsonb DEFAULT NULL;

-- Adicionar comentário para documentar o propósito do campo
COMMENT ON COLUMN public.mentorados.canvas_data IS 'Dados do canvas Tldraw em formato JSON para notas visuais e diagramas';