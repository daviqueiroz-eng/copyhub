
-- Create SECURITY DEFINER function to check group membership (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_grupo_member(_user_id uuid, _grupo_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.grupos_membros
    WHERE grupo_id = _grupo_id
      AND user_id = _user_id
  )
$$;

-- Drop existing policies on grupos
DROP POLICY IF EXISTS "Criador e membros podem ver grupo" ON grupos;

-- Recreate grupos SELECT policy using the function
CREATE POLICY "Criador e membros podem ver grupo"
ON grupos FOR SELECT
USING (
  created_by = auth.uid() 
  OR is_grupo_member(auth.uid(), id)
);

-- Drop existing policies on grupos_membros
DROP POLICY IF EXISTS "Ver membros do grupo" ON grupos_membros;
DROP POLICY IF EXISTS "Criador pode gerenciar membros" ON grupos_membros;

-- Criador pode gerenciar membros (simple, only looks at grupos)
CREATE POLICY "Criador pode gerenciar membros"
ON grupos_membros FOR ALL
USING (
  EXISTS (SELECT 1 FROM grupos WHERE id = grupo_id AND created_by = auth.uid())
);

-- Ver membros: criador ou membro do grupo (using function to break recursion)
CREATE POLICY "Ver membros do grupo"
ON grupos_membros FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM grupos 
    WHERE id = grupo_id 
    AND (created_by = auth.uid() OR is_grupo_member(auth.uid(), grupo_id))
  )
);
