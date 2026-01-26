

## Plano: Receber Resposta do Webhook e Popular Estrutura

### Objetivo

Quando o webhook n8n retornar com os roteiros gerados, atualizar o campo "estrutura" de cada headline correspondente na interface.

---

### Fluxo Atual vs Novo

```text
ATUAL:
Clica "Gerar" → Envia para webhook → Fecha dialog → FIM
                      ↓
            (resposta ignorada)

NOVO:
Clica "Gerar" → Envia para webhook → Aguarda resposta
                                           ↓
                              Recebe JSON com roteiros gerados
                                           ↓
                              Atualiza campo "estrutura" de cada headline
                                           ↓
                              Fecha dialog → Toast de sucesso
```

---

### Formato Esperado da Resposta do n8n

O webhook deve retornar um JSON assim:

```json
{
  "roteiros": [
    {
      "key": "1-1",
      "estrutura": "GANCHO:\nVocê sabia que...\n\nDESENVOLVIMENTO:\n..."
    },
    {
      "key": "1-2",
      "estrutura": "ABERTURA:\nNeste vídeo...\n\nPONTO 1:\n..."
    }
  ]
}
```

---

### Mudanças Necessárias

#### 1. Modificar TipoRoteiroDialog para Retornar Resposta

Atualizar a interface do callback para incluir os dados retornados pelo webhook:

```tsx
interface TipoRoteiroDialogProps {
  // ... existentes
  onConfirm: (
    headlines: HeadlineComTipo[], 
    webhookResponse: WebhookResponse | null
  ) => void;
}

interface WebhookResponse {
  roteiros: Array<{
    key: string;
    estrutura: string;
  }>;
}
```

---

#### 2. Capturar Resposta do Webhook

Modificar o `handleConfirm` para ler o retorno do fetch:

```tsx
const handleConfirm = async () => {
  // ... preparar payload (existente)

  let webhookResponse: WebhookResponse | null = null;

  try {
    const response = await fetch("https://madarawin.app.n8n.cloud/webhook-test/agente-ia-lovable-roteiros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    if (response.ok) {
      webhookResponse = await response.json();
    }
  } catch (error) {
    console.error("Erro ao enviar para webhook:", error);
  }

  onConfirm(result, webhookResponse);
};
```

---

#### 3. Atualizar MentoradoRoteirosView para Processar Resposta

No callback do dialog, popular o campo "estrutura" com os dados retornados:

```tsx
<TipoRoteiroDialog
  // ... props existentes
  onConfirm={(headlinesComTipo, webhookResponse) => {
    // Atualizar estrutura de cada roteiro com a resposta
    if (webhookResponse?.roteiros) {
      setRoteirosLocais((prev) => {
        const newMap = new Map(prev);
        
        for (const roteiroRetornado of webhookResponse.roteiros) {
          const existing = newMap.get(roteiroRetornado.key);
          if (existing) {
            newMap.set(roteiroRetornado.key, {
              ...existing,
              estrutura: roteiroRetornado.estrutura,
            });
          }
        }
        
        return newMap;
      });

      // Disparar save para cada roteiro atualizado
      webhookResponse.roteiros.forEach(r => {
        const [guiaNumero, ordem] = r.key.split("-").map(Number);
        // Aqui poderia chamar o debounced save para persistir
      });
    }

    toast({
      title: "Roteiros gerados!",
      description: `${headlinesComTipo.length} roteiro(s) foram gerados e preenchidos`,
    });
    
    setShowTipoRoteiroDialog(false);
    setSelectedRoteiroKeys([]);
  }}
/>
```

---

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/mentorados/TipoRoteiroDialog.tsx` | Capturar resposta JSON do webhook e passar no callback |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Processar resposta e atualizar `roteirosLocais` com as estruturas geradas |

---

### Experiência Final do Usuário

1. **Seleciona headlines** → Checkboxes nos roteiros
2. **Clica "Gerar roteiro"** → Dialog abre
3. **Escolhe tipo para cada headline** → Dropdown individual
4. **Clica "Gerar"** → Mostra loading (opcional)
5. **Webhook processa e retorna** → Estruturas são preenchidas automaticamente
6. **Dialog fecha** → Toast de sucesso
7. **Campos "ESTRUTURA" populados** → Usuário vê o roteiro gerado

---

### Detalhes Técnicos

O `roteirosLocais` é um `Map<string, RoteiroLocal>` onde:
- **Chave**: `"guiaNumero-ordem"` (ex: `"1-1"`, `"1-2"`)
- **Valor**: `{ headline: string, estrutura: string }`

Ao receber a resposta, iteramos pelos roteiros retornados e atualizamos apenas o campo `estrutura`, mantendo o `headline` existente.

