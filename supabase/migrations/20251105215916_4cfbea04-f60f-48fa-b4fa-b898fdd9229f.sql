-- Adicionar campos nicho_id e link_video na tabela roteiros
ALTER TABLE public.roteiros 
ADD COLUMN nicho_id UUID REFERENCES public.nichos(id),
ADD COLUMN link_video TEXT;

-- Atualizar cores de análise com as 5 novas cores
DELETE FROM public.cores_analise;

INSERT INTO public.cores_analise (nome, cor, ordem) VALUES
('Headline', '#EF4444', 1),
('Intensificador do mistério', '#F97316', 2),
('Conteúdo notável', '#10B981', 3),
('Apresentação magnética', '#3B82F6', 4),
('CTA', '#EAB308', 5);