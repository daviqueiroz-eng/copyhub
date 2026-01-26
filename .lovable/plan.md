

## Plano: Disparar Webhook ao Gerar Roteiro

### Objetivo

Quando o usuário clicar em "Gerar" no dialog de tipo de roteiro, enviar os dados para o webhook do n8n.

---

### Dados a Enviar

| Campo | Origem | Descrição |
|-------|--------|-----------|
| `informacoes_mentorado` | `mentorados.informacoes_mentorado` | Informações do mentorado |
| `apresentacao` | `mentorados.apresentacao` | Apresentação do mentorado |
| `headline` | Campo do roteiro selecionado | Headline para gerar |
| `tipo_roteiro` | Tipo selecionado no dialog | Nome do tipo de roteiro |

---

### Estrutura do Payload

```json
{
  "mentorado": {
    "nome": "João Silva",
    "informacoes_mentorado": "Texto com informações...",
    "apresentacao": "Texto de apresentação..."
  },
  "roteiros": [
    {
      "key": "1-1",
      "headline": "3 coisas que ninguém te conta sobre...",
      "estrutura": "...",
      "tipo_roteiro": "Lista útil",
      "tipo_config": {
        "prompt": "...",
        "template_estrutura": "..."
      }
    },
    {
      "key": "1-2",
      "headline": "Por que você ainda está errando...",
      "estrutura": "...",
      "tipo_roteiro": "Defesa de crença",
      "tipo_config": { ... }
    }
  ]
}
```

---

### Mudanças Necessárias

#### 1. Atualizar TipoRoteiroDialog Props

Adicionar prop para receber dados do mentorado:

```tsx
interface TipoRoteiroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headlines: HeadlineParaGerar[];
  mentoradoData: {
    nome: string;
    informacoes_mentorado: string | null;
    apresentacao: string | null;
  };
  onConfirm: (headlines: HeadlineComTipo[]) => void;
}
```

---

#### 2. Disparar Webhook no handleConfirm

Fazer o POST para o webhook n8n dentro do `handleConfirm`:

```tsx
const handleConfirm = async () => {
  const result: HeadlineComTipo[] = headlines.map(headline => {
    const tipoId = selectedTipos[headline.key];
    const tipo = tipos.find(t => t.id === tipoId);
    return {
      ...headline,
      tipoId,
      tipoNome: tipo?.nome || "",
      tipoConfig: {
        prompt: tipo?.prompt || null,
        template_estrutura: tipo?.template_estrutura || null,
        config_extra: tipo?.config_extra || null,
      }
    };
  });

  // Preparar payload para n8n
  const payload = {
    mentorado: {
      nome: mentoradoData.nome,
      informacoes_mentorado: mentoradoData.informacoes_mentorado,
      apresentacao: mentoradoData.apresentacao,
    },
    roteiros: result.map(r => ({
      key: r.key,
      headline: r.headline,
      estrutura: r.estrutura,
      tipo_roteiro: r.tipoNome,
      tipo_config: r.tipoConfig,
    })),
  };

  // Enviar para webhook n8n
  try {
    await fetch("https://madarawin.app.n8n.cloud/webhook-test/agente-ia-lovable-roteiros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Erro ao enviar para webhook:", error);
  }

  onConfirm(result);
};
```

---

#### 3. Passar Dados do Mentorado no MentoradoRoteirosView

```tsx
<TipoRoteiroDialog
  open={showTipoRoteiroDialog}
  onOpenChange={setShowTipoRoteiroDialog}
  headlines={selectedRoteiroKeys.map(key => {
    const roteiro = roteirosLocais.get(key);
    return {
      key,
      headline: roteiro?.headline || "",
      estrutura: roteiro?.estrutura || "",
    };
  })}
  mentoradoData={{
    nome: mentoradoNome,
    informacoes_mentorado: currentMentorado?.informacoes_mentorado || null,
    apresentacao: currentMentorado?.apresentacao || null,
  }}
  onConfirm={(headlinesComTipo) => {
    toast({
      title: "Roteiros enviados!",
      description: `${headlinesComTipo.length} roteiro(s) enviados para geração`,
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
| `src/components/mentorados/TipoRoteiroDialog.tsx` | Adicionar prop `mentoradoData` e lógica do webhook |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Passar dados do mentorado para o dialog |

---

### Fluxo Final

```text
┌─────────────────────────────────────────────────────────────────┐
│  Usuário seleciona headlines com checkbox                       │
│                         ↓                                       │
│  Clica em "Gerar roteiro"                                       │
│                         ↓                                       │
│  Dialog abre → Escolhe tipo para cada headline                  │
│                         ↓                                       │
│  Clica em "Gerar"                                               │
│                         ↓                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  POST para webhook n8n:                                  │    │
│  │  - informacoes_mentorado                                 │    │
│  │  - apresentacao                                          │    │
│  │  - headline                                              │    │
│  │  - tipo_roteiro                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                         ↓                                       │
│  Toast de sucesso                                               │
└─────────────────────────────────────────────────────────────────┘
```

