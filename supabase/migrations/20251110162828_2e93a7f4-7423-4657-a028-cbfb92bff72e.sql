-- Adicionar colunas para marcar ideias como concluídas
ALTER TABLE public.ideias_melhorias 
ADD COLUMN IF NOT EXISTS concluida boolean NOT NULL DEFAULT false;

ALTER TABLE public.ideias_melhorias 
ADD COLUMN IF NOT EXISTS data_conclusao timestamp with time zone;

-- Criar política RLS para UPDATE (apenas admins)
CREATE POLICY "Apenas admins podem atualizar status de ideias"
ON public.ideias_melhorias FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));