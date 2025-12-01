CREATE TABLE IF NOT EXISTS public.comunicados (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  titulo text NOT NULL,
  conteudo text NOT NULL,
  tipo text DEFAULT 'geral' NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.comunicados_reacoes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  comunicado_id uuid NOT NULL REFERENCES public.comunicados(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (comunicado_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS public.comunicados_comentarios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  comunicado_id uuid NOT NULL REFERENCES public.comunicados(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  comentario text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicados_reacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicados_comentarios ENABLE ROW LEVEL SECURITY;