-- Tabela principal do grupo
CREATE TABLE public.grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao_meta TEXT,
  data_inicio_meta DATE,
  data_fim_meta DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Membros do grupo (usuários do sistema)
CREATE TABLE public.grupos_membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id UUID NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  apelido TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(grupo_id, user_id)
);

-- Mentorados específicos do grupo
CREATE TABLE public.grupos_mentorados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id UUID NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  membro_id UUID NOT NULL REFERENCES public.grupos_membros(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tags coloridas personalizáveis
CREATE TABLE public.grupos_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id UUID NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL DEFAULT '#22c55e',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Relacionamento mentorado x tag
CREATE TABLE public.grupos_mentorados_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorado_id UUID NOT NULL REFERENCES public.grupos_mentorados(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.grupos_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mentorado_id, tag_id)
);

-- Atividades gerais do grupo
CREATE TABLE public.grupos_atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id UUID NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_limite DATE,
  concluida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos_mentorados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos_mentorados_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos_atividades ENABLE ROW LEVEL SECURITY;

-- RLS para grupos: criador ou membros podem ver
CREATE POLICY "Criador e membros podem ver grupo"
ON public.grupos FOR SELECT
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.grupos_membros 
    WHERE grupos_membros.grupo_id = grupos.id 
    AND grupos_membros.user_id = auth.uid()
  )
);

CREATE POLICY "Criador pode criar grupo"
ON public.grupos FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Criador pode atualizar grupo"
ON public.grupos FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Criador pode deletar grupo"
ON public.grupos FOR DELETE
USING (created_by = auth.uid());

-- RLS para membros
CREATE POLICY "Ver membros do grupo"
ON public.grupos_membros FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.grupos 
    WHERE grupos.id = grupos_membros.grupo_id 
    AND (grupos.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.grupos_membros gm 
      WHERE gm.grupo_id = grupos.id AND gm.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Criador pode gerenciar membros"
ON public.grupos_membros FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.grupos 
    WHERE grupos.id = grupos_membros.grupo_id 
    AND grupos.created_by = auth.uid()
  )
);

-- RLS para mentorados do grupo
CREATE POLICY "Ver mentorados do grupo"
ON public.grupos_mentorados FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.grupos_membros gm
    JOIN public.grupos g ON g.id = gm.grupo_id
    WHERE gm.id = grupos_mentorados.membro_id
    AND (g.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.grupos_membros gm2 
      WHERE gm2.grupo_id = g.id AND gm2.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Membro pode gerenciar seus mentorados"
ON public.grupos_mentorados FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.grupos_membros gm
    WHERE gm.id = grupos_mentorados.membro_id
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Criador pode gerenciar todos mentorados"
ON public.grupos_mentorados FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.grupos_membros gm
    JOIN public.grupos g ON g.id = gm.grupo_id
    WHERE gm.id = grupos_mentorados.membro_id
    AND g.created_by = auth.uid()
  )
);

-- RLS para tags
CREATE POLICY "Ver tags do grupo"
ON public.grupos_tags FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.grupos g
    WHERE g.id = grupos_tags.grupo_id
    AND (g.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.grupos_membros gm 
      WHERE gm.grupo_id = g.id AND gm.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Criador pode gerenciar tags"
ON public.grupos_tags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.grupos g
    WHERE g.id = grupos_tags.grupo_id
    AND g.created_by = auth.uid()
  )
);

-- RLS para mentorados_tags
CREATE POLICY "Ver tags de mentorados"
ON public.grupos_mentorados_tags FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.grupos_mentorados gm
    JOIN public.grupos_membros gmb ON gmb.id = gm.membro_id
    JOIN public.grupos g ON g.id = gmb.grupo_id
    WHERE gm.id = grupos_mentorados_tags.mentorado_id
    AND (g.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.grupos_membros gm2 
      WHERE gm2.grupo_id = g.id AND gm2.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Membros podem gerenciar tags de seus mentorados"
ON public.grupos_mentorados_tags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.grupos_mentorados gm
    JOIN public.grupos_membros gmb ON gmb.id = gm.membro_id
    WHERE gm.id = grupos_mentorados_tags.mentorado_id
    AND gmb.user_id = auth.uid()
  )
);

-- RLS para atividades
CREATE POLICY "Ver atividades do grupo"
ON public.grupos_atividades FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.grupos g
    WHERE g.id = grupos_atividades.grupo_id
    AND (g.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.grupos_membros gm 
      WHERE gm.grupo_id = g.id AND gm.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Criador pode gerenciar atividades"
ON public.grupos_atividades FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.grupos g
    WHERE g.id = grupos_atividades.grupo_id
    AND g.created_by = auth.uid()
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_grupos_updated_at
BEFORE UPDATE ON public.grupos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grupos_mentorados_updated_at
BEFORE UPDATE ON public.grupos_mentorados
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grupos_atividades_updated_at
BEFORE UPDATE ON public.grupos_atividades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();