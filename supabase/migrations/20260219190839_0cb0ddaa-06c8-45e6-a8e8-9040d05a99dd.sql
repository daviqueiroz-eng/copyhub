
CREATE TABLE public.mentorado_notas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  mentorado_id uuid NOT NULL REFERENCES public.mentorados(id) ON DELETE CASCADE,
  conteudo text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, mentorado_id)
);

ALTER TABLE public.mentorado_notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes" ON public.mentorado_notas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notes" ON public.mentorado_notas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON public.mentorado_notas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON public.mentorado_notas FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_mentorado_notas_updated_at BEFORE UPDATE ON public.mentorado_notas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
