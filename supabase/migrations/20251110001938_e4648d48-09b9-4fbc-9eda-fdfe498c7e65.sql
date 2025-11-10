-- Adicionar campo data_limite para armazenar a data de referência fixa
ALTER TABLE public.entregas_mentorados
ADD COLUMN data_limite date;

-- Copiar valores existentes de data_entrega para data_limite
UPDATE public.entregas_mentorados
SET data_limite = data_entrega
WHERE data_entrega IS NOT NULL;

-- Adicionar comentário para documentar o propósito dos campos
COMMENT ON COLUMN public.entregas_mentorados.data_limite IS 'Data de referência fixa definida na aba Geral (norte/meta)';
COMMENT ON COLUMN public.entregas_mentorados.data_entrega IS 'Data atual da entrega, pode ser alterada no calendário';