

## Plano: Corrigir CORS Usando Edge Function

### Problema Identificado

O erro **"Failed to fetch"** acontece porque o navegador bloqueia requisições diretas (CORS) para domínios externos como `madarawin.app.n8n.cloud`. 

Requisições do frontend para APIs externas precisam passar por um proxy backend.

---

### Solução

Criar uma **Edge Function** que:
1. Recebe os dados do frontend
2. Faz a requisição para o webhook n8n (sem restrição de CORS)
3. Retorna a resposta para o frontend

---

### Arquitetura

```text
ANTES (bloqueado por CORS):
┌──────────┐     ✖ CORS     ┌──────────┐
│ Frontend │ ──────────────→ │   n8n    │
└──────────┘                 └──────────┘

DEPOIS (funciona):
┌──────────┐              ┌──────────────┐              ┌──────────┐
│ Frontend │ ──────────→ │ Edge Function │ ──────────→ │   n8n    │
└──────────┘   mesma      └──────────────┘   servidor   └──────────┘
               origem         (proxy)        para servidor
```

---

### Mudanças Necessárias

#### 1. Criar Edge Function `n8n-webhook`

Nova função em `supabase/functions/n8n-webhook/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    // Enviar para n8n
    const n8nResponse = await fetch(
      "https://madarawin.app.n8n.cloud/webhook-test/agente-ia-lovable-roteiros",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await n8nResponse.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

---

#### 2. Atualizar TipoRoteiroDialog

Trocar a chamada direta para n8n pela Edge Function:

```tsx
// ANTES
await fetch("https://madarawin.app.n8n.cloud/webhook-test/agente-ia-lovable-roteiros", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

// DEPOIS
import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase.functions.invoke("n8n-webhook", {
  body: payload,
});

if (!error && data) {
  webhookResponse = data;
}
```

---

### Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/n8n-webhook/index.ts` | **CRIAR** - Proxy para o webhook n8n |
| `src/components/mentorados/TipoRoteiroDialog.tsx` | Usar Edge Function ao invés de fetch direto |

---

### Benefícios

1. **Sem CORS**: Servidor para servidor não tem restrição
2. **Segurança**: URL do webhook fica no backend, não exposta no frontend
3. **Logs**: Podemos ver os logs da Edge Function para debug
4. **Flexibilidade**: Fácil trocar a URL do webhook sem rebuild do frontend

