-- Adicionar novos campos para análise expandida de roteiros
ALTER TABLE public.progresso_roteiros 
ADD COLUMN IF NOT EXISTS carga_cognitiva INTEGER CHECK (carga_cognitiva >= 1 AND carga_cognitiva <= 10),
ADD COLUMN IF NOT EXISTS o_que_tornou_viral TEXT,
ADD COLUMN IF NOT EXISTS melhorias_potencial TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.progresso_roteiros.carga_cognitiva IS 'Nível de carga cognitiva do roteiro (1-10)';
COMMENT ON COLUMN public.progresso_roteiros.o_que_tornou_viral IS 'Análise do que tornou o vídeo viral';
COMMENT ON COLUMN public.progresso_roteiros.melhorias_potencial IS 'Sugestões de melhorias para aumentar potencial do roteiro';