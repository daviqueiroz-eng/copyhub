ALTER TABLE public.mentorados_guias_config
  ADD COLUMN IF NOT EXISTS is_folha_branco boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS folha_branco_content text NOT NULL DEFAULT '';