-- Tabela de Iniciativas
CREATE TABLE public.sprints_iniciativas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  descricao text,
  criterio_conclusao text,
  dono_id uuid REFERENCES public.profiles(user_id),
  prazo_entrega date,
  impacto text DEFAULT 'medio' CHECK (impacto IN ('baixo', 'medio', 'alto')),
  status text DEFAULT 'backlog' CHECK (status IN ('backlog', 'sprint', 'finalizado')),
  arquivada boolean DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Tarefas
CREATE TABLE public.sprints_tarefas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  iniciativa_id uuid REFERENCES public.sprints_iniciativas(id) ON DELETE CASCADE NOT NULL,
  texto text NOT NULL,
  concluida boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RLS para sprints_iniciativas
ALTER TABLE public.sprints_iniciativas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view iniciativas" ON public.sprints_iniciativas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert iniciativas" ON public.sprints_iniciativas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update iniciativas" ON public.sprints_iniciativas
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete iniciativas" ON public.sprints_iniciativas
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- RLS para sprints_tarefas
ALTER TABLE public.sprints_tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tarefas" ON public.sprints_tarefas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert tarefas" ON public.sprints_tarefas
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update tarefas" ON public.sprints_tarefas
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete tarefas" ON public.sprints_tarefas
  FOR DELETE TO authenticated USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_sprints_iniciativas_updated_at
  BEFORE UPDATE ON public.sprints_iniciativas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();