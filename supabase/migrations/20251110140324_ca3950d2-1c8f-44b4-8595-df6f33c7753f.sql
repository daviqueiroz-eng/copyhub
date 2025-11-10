-- Corrigir políticas RLS da tabela ideias_melhorias para permitir usuários autenticados

-- Drop política incorreta que só funciona para role public
DROP POLICY IF EXISTS "Qualquer pessoa pode criar ideias" ON public.ideias_melhorias;

-- Criar nova política que funciona para usuários autenticados
CREATE POLICY "Usuários autenticados podem criar ideias"
ON public.ideias_melhorias FOR INSERT
TO authenticated
WITH CHECK (true);

-- Adicionar política para usuários verem suas próprias submissões
-- Isso permite que o usuário confirme o envio e veja suas ideias
CREATE POLICY "Usuários podem ver suas próprias ideias"
ON public.ideias_melhorias FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));