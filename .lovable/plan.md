

## Plano: Seleção Individual de Tipo de Roteiro por Headline

### Objetivo

Modificar o dialog "Gerar Roteiro" para mostrar cada headline selecionada individualmente, permitindo escolher um tipo de roteiro diferente para cada uma.

---

### Visual Atual vs Novo

```text
ATUAL:
┌─────────────────────────────────────────────────────────────────┐
│ Gerar Roteiro                                               [X] │
├─────────────────────────────────────────────────────────────────┤
│  📝 2 headlines selecionadas                                    │
│                                                                 │
│  Selecione o tipo de roteiro:                                   │
│  ◉ Lista útil ✓ configurado                                     │
│  ○ Defesa de crença                                             │
│                                                                 │
│                              [Cancelar]  [Gerar]                │
└─────────────────────────────────────────────────────────────────┘
  ↓ Um tipo para TODAS as headlines

NOVO:
┌─────────────────────────────────────────────────────────────────┐
│ Gerar Roteiro                                               [X] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ HEADLINE 1:                                             │    │
│  │ "3 coisas que ninguém te conta sobre..."                │    │
│  │                                                         │    │
│  │ Tipo: [  Selecionar tipo  ▾]                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ HEADLINE 2:                                             │    │
│  │ "Por que você ainda está errando em..."                 │    │
│  │                                                         │    │
│  │ Tipo: [  Lista útil  ▾]                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  [+ Novo tipo]                      [Cancelar]  [Gerar]         │
└─────────────────────────────────────────────────────────────────┘
  ↓ Cada headline com SEU tipo
```

---

### Mudanças Necessárias

#### 1. Atualizar Props do TipoRoteiroDialog

Passar as headlines com seus dados ao invés de apenas a contagem:

```tsx
// ANTES
interface TipoRoteiroDialogProps {
  headlinesCount: number;
  onConfirm: (tipoId: string, tipoNome: string, tipoConfig: {...}) => void;
}

// DEPOIS
interface HeadlineParaGerar {
  key: string;
  headline: string;
  estrutura: string;
}

interface HeadlineComTipo {
  key: string;
  headline: string;
  estrutura: string;
  tipoId: string;
  tipoNome: string;
  tipoConfig: {
    prompt: string | null;
    template_estrutura: string | null;
    config_extra: unknown;
  };
}

interface TipoRoteiroDialogProps {
  headlines: HeadlineParaGerar[];  // Recebe array de headlines
  onConfirm: (headlines: HeadlineComTipo[]) => void;  // Retorna com tipos
}
```

---

#### 2. Reformular o Layout do Dialog

Mostrar cada headline em um card com seu próprio dropdown de seleção:

```tsx
<Dialog>
  <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Gerar Roteiro</DialogTitle>
    </DialogHeader>

    <div className="py-4 space-y-4">
      {headlines.map((headline, index) => (
        <div key={headline.key} className="border rounded-lg p-4 space-y-3">
          {/* Número e texto da headline */}
          <div>
            <span className="text-xs text-muted-foreground font-medium">
              HEADLINE {index + 1}:
            </span>
            <p className="text-sm font-medium mt-1">
              {headline.headline || "(sem headline)"}
            </p>
          </div>
          
          {/* Select do tipo */}
          <div className="flex items-center gap-2">
            <Label className="text-xs shrink-0">Tipo:</Label>
            <Select
              value={selectedTipos[headline.key] || ""}
              onValueChange={(value) => handleSelectTipo(headline.key, value)}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Selecionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {tipos.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
    </div>

    {/* Seção para gerenciar tipos */}
    <div className="border-t pt-4 flex items-center justify-between">
      <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Novo tipo
      </Button>
      
      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleConfirm} disabled={!allHeadlinesHaveTipo}>
          Gerar
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

---

#### 3. Gerenciar Estado de Seleção Individual

Usar um objeto para mapear cada headline ao seu tipo selecionado:

```tsx
// Estado: { "1-1": "tipo-uuid-1", "1-2": "tipo-uuid-2", ... }
const [selectedTipos, setSelectedTipos] = useState<Record<string, string>>({});

const handleSelectTipo = (headlineKey: string, tipoId: string) => {
  setSelectedTipos(prev => ({
    ...prev,
    [headlineKey]: tipoId
  }));
};

// Verificar se todas têm tipo selecionado
const allHeadlinesHaveTipo = headlines.every(h => selectedTipos[h.key]);
```

---

#### 4. Atualizar onConfirm

Retornar array com cada headline e seu tipo:

```tsx
const handleConfirm = () => {
  const result = headlines.map(headline => {
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
  
  onConfirm(result);
};
```

---

#### 5. Atualizar MentoradoRoteirosView

Ajustar como os dados são passados e recebidos:

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
  onConfirm={(headlinesComTipo) => {
    // Agora recebemos array com tipo individual para cada headline
    console.log("Gerar roteiros:", headlinesComTipo);
    
    toast({
      title: "Roteiros serão gerados!",
      description: `${headlinesComTipo.length} roteiro(s) com tipos individuais`,
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
| `src/components/mentorados/TipoRoteiroDialog.tsx` | Reformular layout e props para seleção individual |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Ajustar passagem de dados e callback |

---

### Dados Enviados ao n8n (Novo Formato)

```json
[
  {
    "key": "1-1",
    "headline": "3 coisas que ninguém te conta sobre...",
    "estrutura": "...",
    "tipoId": "uuid-tipo-1",
    "tipoNome": "Lista útil",
    "tipoConfig": {
      "prompt": "Você é um especialista...",
      "template_estrutura": "GANCHO:\n..."
    }
  },
  {
    "key": "1-2",
    "headline": "Por que você ainda está errando em...",
    "estrutura": "...",
    "tipoId": "uuid-tipo-2",
    "tipoNome": "Defesa de crença",
    "tipoConfig": {
      "prompt": "Crie um roteiro...",
      "template_estrutura": null
    }
  }
]
```

---

### Comportamento Final

1. **Usuário seleciona headlines** → Checkboxes nos roteiros
2. **Clica em "Gerar roteiro"** → Abre dialog mostrando CADA headline
3. **Para cada headline** → Escolhe o tipo de roteiro no dropdown
4. **Clica em "Gerar"** → Envia cada headline com seu tipo individual para n8n

