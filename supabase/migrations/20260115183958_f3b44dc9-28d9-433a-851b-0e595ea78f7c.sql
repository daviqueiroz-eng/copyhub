-- Create DELETE policy for admin on roteiro_feedbacks
CREATE POLICY "Admins can delete feedbacks" 
ON public.roteiro_feedbacks 
FOR DELETE 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'::public.app_role));