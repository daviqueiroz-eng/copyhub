-- Tabela de notas rápidas
CREATE TABLE public.flow_notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  cor TEXT DEFAULT '#fbbf24',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_flow_notas_user_id ON public.flow_notas(user_id);
CREATE INDEX idx_flow_notas_created_at ON public.flow_notas(created_at DESC);

CREATE TRIGGER update_flow_notas_updated_at
  BEFORE UPDATE ON public.flow_notas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.flow_notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias notas"
  ON public.flow_notas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias notas"
  ON public.flow_notas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias notas"
  ON public.flow_notas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias notas"
  ON public.flow_notas FOR DELETE
  USING (auth.uid() = user_id);

-- Tabela de tarefas kanban
CREATE TABLE public.flow_tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
  ordem INTEGER NOT NULL DEFAULT 0,
  prioridade TEXT DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta')),
  data_limite DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_flow_tarefas_user_id ON public.flow_tarefas(user_id);
CREATE INDEX idx_flow_tarefas_status ON public.flow_tarefas(status);
CREATE INDEX idx_flow_tarefas_ordem ON public.flow_tarefas(ordem);

CREATE TRIGGER update_flow_tarefas_updated_at
  BEFORE UPDATE ON public.flow_tarefas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.flow_tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias tarefas"
  ON public.flow_tarefas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias tarefas"
  ON public.flow_tarefas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias tarefas"
  ON public.flow_tarefas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias tarefas"
  ON public.flow_tarefas FOR DELETE
  USING (auth.uid() = user_id);

-- Tabela de sessões pomodoro (histórico opcional)
CREATE TABLE public.flow_pomodoro_sessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  duracao_minutos INTEGER NOT NULL,
  completada BOOLEAN NOT NULL DEFAULT false,
  tipo TEXT NOT NULL DEFAULT 'trabalho' CHECK (tipo IN ('trabalho', 'pausa_curta', 'pausa_longa')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_flow_pomodoro_user_id ON public.flow_pomodoro_sessoes(user_id);
CREATE INDEX idx_flow_pomodoro_created_at ON public.flow_pomodoro_sessoes(created_at DESC);

ALTER TABLE public.flow_pomodoro_sessoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias sessões"
  ON public.flow_pomodoro_sessoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias sessões"
  ON public.flow_pomodoro_sessoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);