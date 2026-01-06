-- Adicionar coluna link_trello na tabela mentorados
ALTER TABLE public.mentorados 
ADD COLUMN link_trello TEXT DEFAULT NULL;