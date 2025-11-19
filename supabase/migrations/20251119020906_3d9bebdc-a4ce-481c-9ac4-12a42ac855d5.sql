-- Adicionar foreign key para deletar progresso_roteiros quando usuário é deletado
ALTER TABLE public.progresso_roteiros
ADD CONSTRAINT progresso_roteiros_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;