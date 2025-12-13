-- Ensure there's a policy allowing authenticated users to read all active profiles
DROP POLICY IF EXISTS "Todos podem ver perfis" ON profiles;

CREATE POLICY "Todos podem ver perfis"
ON profiles FOR SELECT
USING (true);