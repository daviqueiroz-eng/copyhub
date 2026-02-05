

## Plano: Adicionar "Selecionar estrutura" com Cópia Formatada

### Resumo

Adicionar um botão **"Selecionar estrutura"** ao lado do botão "Gerar roteiro". Ao clicar, abre um dialog similar ao TipoRoteiroDialog onde o usuário pode:
1. Ver todas as headlines selecionadas
2. Selecionar um "tipo de estrutura" para cada uma (usando os tipos já cadastrados em `tipos_roteiro`)
3. Em vez de "Gerar", clicar em **"Copiar"** para copiar no formato especificado

### Formato da Cópia

```
Headline 1: [texto da headline]

Estrutura
[template_estrutura do tipo selecionado]

Headline 2: [texto da headline]

Estrutura
[template_estrutura do tipo selecionado]

...
```

---

### Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/mentorados/SelecionarEstruturaDialog.tsx` | Criar | Novo dialog para seleção de estruturas e cópia |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Modificar | Adicionar botão e estado para abrir o novo dialog |

---

### 1. Novo Componente: SelecionarEstruturaDialog

**Props:**
```typescript
interface SelecionarEstruturaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headlines: { key: string; headline: string; estrutura: string }[];
}
```

**Funcionalidades:**
- Lista todas as headlines selecionadas
- Cada headline tem um Select para escolher o tipo de estrutura
- "Selecionar todas" para marcar/desmarcar
- Barra de ação em massa para aplicar um tipo a várias headlines
- Botões: "Voltar", "+ Novo tipo", "Cancelar", "Copiar (X)"
- Ao clicar em "Copiar", gera o texto formatado e copia para clipboard

**Layout (similar ao TipoRoteiroDialog etapa 2):**
```text
+--------------------------------------------------+
|              Selecionar estrutura                |
+--------------------------------------------------+
| ○ Selecionar todas                               |
+--------------------------------------------------+
| ┌──────────────────────────────────────────────┐ |
| │ ○ HEADLINE 1:                                │ |
| │   faça essas 3 coisas se quiser...           │ |
| │   Tipo: [Selecionar tipo ▼]                  │ |
| └──────────────────────────────────────────────┘ |
| ┌──────────────────────────────────────────────┐ |
| │ ○ HEADLINE 2:                                │ |
| │   eu não sei quem precisa ouvir isso...      │ |
| │   Tipo: [Selecionar tipo ▼]                  │ |
| └──────────────────────────────────────────────┘ |
+--------------------------------------------------+
| [← Voltar] [+ Novo tipo] [Cancelar] [Copiar (2)] |
+--------------------------------------------------+
```

---

### 2. Lógica de Cópia

```typescript
const handleCopy = () => {
  const textParts: string[] = [];
  
  headlines.forEach((headline, index) => {
    const numero = index + 1;
    const tipoId = selectedTipos[headline.key];
    const tipo = tipos.find(t => t.id === tipoId);
    
    textParts.push(`Headline ${numero}: ${headline.headline}`);
    textParts.push("");
    textParts.push("Estrutura");
    textParts.push(tipo?.template_estrutura || "(sem estrutura definida)");
    textParts.push("");
  });
  
  const finalText = textParts.join("\n");
  navigator.clipboard.writeText(finalText);
  
  toast({
    title: "Copiado!",
    description: `${headlines.length} headlines copiadas com suas estruturas.`,
  });
  
  onOpenChange(false);
};
```

---

### 3. Modificações em MentoradoRoteirosView

**Adicionar estado:**
```typescript
const [showSelecionarEstruturaDialog, setShowSelecionarEstruturaDialog] = useState(false);
```

**Modificar o título "Gerar roteiro" (linha ~2244-2250):**

De:
```tsx
<button 
  className="mb-8 text-2xl font-serif hover:underline cursor-pointer text-foreground"
  onClick={() => setShowTipoRoteiroDialog(true)}
>
  Gerar roteiro
</button>
```

Para:
```tsx
<div className="flex gap-6 mb-8">
  <button 
    className="text-2xl font-serif hover:underline cursor-pointer text-foreground"
    onClick={() => setShowTipoRoteiroDialog(true)}
  >
    Gerar roteiro
  </button>
  <button 
    className="text-2xl font-serif hover:underline cursor-pointer text-foreground"
    onClick={() => setShowSelecionarEstruturaDialog(true)}
  >
    Selecionar estrutura
  </button>
</div>
```

**Adicionar o Dialog no final do componente (após TipoRoteiroDialog):**
```tsx
<SelecionarEstruturaDialog
  open={showSelecionarEstruturaDialog}
  onOpenChange={setShowSelecionarEstruturaDialog}
  headlines={selectedRoteiroKeys.map(key => {
    const roteiro = roteirosLocais.get(key);
    return {
      key,
      headline: roteiro?.headline || "",
      estrutura: roteiro?.estrutura || "",
    };
  })}
/>
```

---

### 4. Botão Flutuante Mobile

Também atualizar o botão flutuante (linha ~2894-2903) para incluir as duas opções, ou manter apenas "Gerar roteiro" e adicionar "Selecionar estrutura" via dropdown/menu.

**Opção simplificada:** Adicionar um segundo botão ao lado:
```tsx
{selectedRoteiroKeys.length > 0 && (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 lg:hidden flex gap-2">
    <Button 
      className="gap-2 shadow-lg"
      onClick={() => setShowTipoRoteiroDialog(true)}
    >
      <FileEdit className="h-4 w-4" />
      Gerar ({selectedRoteiroKeys.length})
    </Button>
    <Button 
      variant="outline"
      className="gap-2 shadow-lg bg-background"
      onClick={() => setShowSelecionarEstruturaDialog(true)}
    >
      <Copy className="h-4 w-4" />
      Estrutura
    </Button>
  </div>
)}
```

---

### Estrutura do Novo Dialog

```tsx
// SelecionarEstruturaDialog.tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Plus, Settings, Check, Copy, ArrowLeft } from "lucide-react";
import { useTiposRoteiro, useCreateTipoRoteiro, TipoRoteiro } from "@/hooks/useTiposRoteiro";
import { TipoRoteiroConfigDialog } from "./TipoRoteiroConfigDialog";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

// ... implementação completa
```

---

### Resumo Visual

**Desktop - Com seleção:**
```text
[✓] Selecionar todas (15)   15 selecionadas

[Gerar roteiro]   [Selecionar estrutura]   <- NOVO

■ HEADLINE 01:
faça essas 3 coisas...
```

**Mobile - Botões flutuantes:**
```text
+----------------------------------+
| [Gerar (15)] [Estrutura]         |
+----------------------------------+
```

---

### Benefícios

1. **Separação de fluxos**: Gerar (com IA) vs Copiar (manual)
2. **Reutilização**: Usa os mesmos tipos de roteiro já cadastrados
3. **Praticidade**: Copiar várias headlines com estruturas de uma vez
4. **Consistência**: Interface similar ao TipoRoteiroDialog

