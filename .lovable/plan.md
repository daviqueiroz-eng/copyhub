
## ✅ Concluído: Webhook Proxy + Copy Prompt + Auto-detect

### Mudanças realizadas:

1. **Edge function `detectar-tipo-roteiro`** agora funciona como proxy: recebe `{ headline, webhookUrl }` e faz o fetch server-side para o n8n, evitando CORS.

2. **`MentoradoRoteirosView.tsx`**: 
   - `triggerTipoDetection` usa `supabase.functions.invoke` ao invés de `fetch` direto
   - Removida a condição que bloqueava detecção quando `tipo_roteiro_id` já estava preenchido
   - `handleCopyRoteiroSimplificado` agora copia `headline + instrucoes_deteccao` (prompt do tipo)

3. **`CheckRoteiroViralDialog.tsx`**: Botão "Testar" usa edge function como proxy
