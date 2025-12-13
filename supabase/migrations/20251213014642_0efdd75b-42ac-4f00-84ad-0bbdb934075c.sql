
-- Drop ALL existing policies on grupos_membros to fix recursion
DROP POLICY IF EXISTS "Criador pode gerenciar membros" ON grupos_membros;
DROP POLICY IF EXISTS "Ver membros do grupo" ON grupos_membros;

-- Create simple non-recursive policy for grupos_membros
-- Criador do grupo pode gerenciar membros (usando apenas grupos.created_by)
CREATE POLICY "Criador pode gerenciar membros"
ON grupos_membros FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM grupos 
    WHERE grupos.id = grupos_membros.grupo_id 
    AND grupos.created_by = auth.uid()
  )
);

-- Ver membros: criador ou membro do grupo (sem recursão)
CREATE POLICY "Ver membros do grupo"
ON grupos_membros FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM grupos 
    WHERE grupos.id = grupos_membros.grupo_id 
    AND (
      grupos.created_by = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM grupos_membros gm 
        WHERE gm.grupo_id = grupos.id 
        AND gm.user_id = auth.uid()
      )
    )
  )
);
