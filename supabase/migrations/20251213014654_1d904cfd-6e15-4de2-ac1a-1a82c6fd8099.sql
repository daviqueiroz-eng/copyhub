
-- Add RLS policies for comunicados table
CREATE POLICY "Todos podem ver comunicados"
ON comunicados FOR SELECT
USING (true);

CREATE POLICY "Apenas admins podem gerenciar comunicados"
ON comunicados FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policies for comunicados_reacoes table  
CREATE POLICY "Todos podem ver reações"
ON comunicados_reacoes FOR SELECT
USING (true);

CREATE POLICY "Usuários podem gerenciar suas reações"
ON comunicados_reacoes FOR ALL
USING (auth.uid() = user_id);

-- Add RLS policies for comunicados_comentarios table
CREATE POLICY "Todos podem ver comentários"
ON comunicados_comentarios FOR SELECT
USING (true);

CREATE POLICY "Usuários podem criar comentários"
ON comunicados_comentarios FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem gerenciar seus comentários"
ON comunicados_comentarios FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários e admins podem deletar comentários"
ON comunicados_comentarios FOR DELETE
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
