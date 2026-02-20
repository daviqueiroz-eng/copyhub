

## Plano: Corrigir Webhook (CORS) + Copiar Prompt do Tipo

### Problema 1: Webhook nao dispara (CORS)
O erro `Failed to fetch` acontece porque o navegador bloqueia chamadas diretas para o n8n por restricoes de CORS. A solucao e usar a edge function `detectar-tipo-roteiro` como **proxy** -- o frontend envia a headline para a edge function, e ela redireciona para o webhook n8n (que roda no servidor, sem CORS).

### Problema 2: Botao de copiar deve incluir o prompt do tipo
Atualmente o botao de copia ao lado do dropdown copia `headline + template_estrutura`. O usuario quer que copie `headline + prompt` (o campo que ele configura na engrenagem como "Instrucoes para a IA").

### Problema 3: O campo "Instrucoes para a IA" deve funcionar como o prompt copiavel
O usuario quer que o campo de instrucoes na aba "Deteccao de Tipo" sirva tambem como o prompt que e copiado quando clica no icone de copiar ao lado do tipo.

---

### Mudancas Tecnicas

#### 1. Edge function `detectar-tipo-roteiro` vira proxy do webhook

Modificar a edge function para aceitar dois modos:
- **Modo webhook**: recebe `{ headline, webhookUrl }` e faz o fetch para o n8n no servidor (sem CORS), retornando `{ tipo: "nome" }`
- **Modo IA** (existente): mantido como fallback caso nao tenha webhook

#### 2. `MentoradoRoteirosView.tsx` - Trocar fetch direto por edge function

Em `triggerTipoDetection`, ao inves de `fetch(webhookUrl)` direto, chamar:
```
supabase.functions.invoke("detectar-tipo-roteiro", {
  body: { headline, webhookUrl }
})
```
Isso resolve o CORS. A edge function faz o proxy.

Tambem **remover a condicao** que bloqueia quando `tipo_roteiro_id` ja esta preenchido (linha 1346), para que a deteccao funcione sempre que a headline muda (nao apenas quando o tipo esta vazio). Manter apenas o bloqueio de `manualTipoChangeRef`.

#### 3. `handleCopyRoteiroSimplificado` - Copiar headline + prompt

Mudar de `tipo.template_estrutura` para `tipo.prompt` (ou `tipo.instrucoes_deteccao` se preferir). O texto copiado sera:
```
headline: [headline]

[prompt do tipo]
```

#### 4. `CheckRoteiroViralDialog.tsx` - Ajustar teste

O botao "Testar" tambem deve usar a edge function como proxy ao inves de fetch direto.

---

### Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/detectar-tipo-roteiro/index.ts` | Adicionar modo proxy: se receber `webhookUrl`, faz fetch para la e retorna resultado |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Trocar `fetch(webhookUrl)` por `supabase.functions.invoke`, remover bloqueio quando tipo ja preenchido, ajustar copy para usar prompt |
| `src/components/mentorados/CheckRoteiroViralDialog.tsx` | Botao "Testar" usar edge function como proxy |

