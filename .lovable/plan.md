

## Plano: Checkbox ao Lado de Cada Headline

### O Que Será Feito

Baseado na imagem de referência, vou adicionar:

1. **Checkbox ao lado do label "HEADLINE XX:"** em cada roteiro
2. **Título "Gerar roteiro" que aparece no topo** quando algum roteiro é selecionado
3. Quando clicar em "Gerar", abre o dialog de seleção de tipo

---

### Visual Final (igual à imagem)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Gerar roteiro                    ← Aparece quando há seleção   │
│                                                                 │
│  ☐  HEADLINE 01:                                                │
│      livros que todo jovem precisa ler em 2025 se quiser...     │
│                                                                 │
│      ESTRUTURA 01:                                              │
│      Digite a estrutura do roteiro... (use / para comandos)     │
│                                                                 │
│  ────────────────────────────────────────────────────────────   │
│                                                                 │
│  ☐  HEADLINE 02:                                                │
│      Digite a headline... (use / para comandos)                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Mudanças Técnicas

#### 1. Adicionar Estado para Roteiros Selecionados

```tsx
// Mudar de IDs de headlines para keys de roteiros (ex: "1-1", "1-2")
const [selectedRoteiroKeys, setSelectedRoteiroKeys] = useState<string[]>([]);
```

#### 2. Modificar o Layout de Cada Roteiro

Adicionar checkbox ao lado do label HEADLINE:

```tsx
{/* ANTES */}
<div className="mb-2">
  <span className="font-poppins font-bold text-[#B8860B] text-base">
    HEADLINE {String(ordem).padStart(2, "0")}:
  </span>
  {/* ... input */}
</div>

{/* DEPOIS */}
<div className="mb-2">
  <div className="flex items-center gap-3">
    <Checkbox
      checked={selectedRoteiroKeys.includes(key)}
      onCheckedChange={(checked) => {
        if (checked) {
          setSelectedRoteiroKeys(prev => [...prev, key]);
        } else {
          setSelectedRoteiroKeys(prev => prev.filter(k => k !== key));
        }
      }}
      className="h-5 w-5"
    />
    <span className="font-poppins font-bold text-[#B8860B] text-base">
      HEADLINE {String(ordem).padStart(2, "0")}:
    </span>
  </div>
  {/* ... input */}
</div>
```

#### 3. Adicionar Título "Gerar roteiro" no Topo

Dentro do paper container, antes dos roteiros:

```tsx
<div className="px-4 sm:px-8 lg:px-16 py-6 lg:py-12">
  {/* Título "Gerar roteiro" - aparece quando há seleção */}
  {selectedRoteiroKeys.length > 0 && (
    <button 
      className="mb-8 text-2xl font-serif hover:underline cursor-pointer"
      onClick={() => setShowTipoRoteiroDialog(true)}
    >
      Gerar roteiro
    </button>
  )}
  
  {/* Roteiros */}
  {Array.from({ length: ... }).map((ordem) => ...)}
</div>
```

#### 4. Atualizar Dialog de Tipo de Roteiro

Passar os roteiros selecionados (com headline e estrutura) para o dialog:

```tsx
<TipoRoteiroDialog
  open={showTipoRoteiroDialog}
  onOpenChange={setShowTipoRoteiroDialog}
  headlinesCount={selectedRoteiroKeys.length}
  onConfirm={(tipoId) => {
    // Pegar conteúdo dos roteiros selecionados
    const roteirosParaGerar = selectedRoteiroKeys.map(key => {
      const roteiro = roteirosLocais.get(key);
      return {
        key,
        headline: roteiro?.headline || "",
        estrutura: roteiro?.estrutura || "",
      };
    });
    
    console.log("Gerar roteiros:", { tipoId, roteiros: roteirosParaGerar });
    setShowTipoRoteiroDialog(false);
    setSelectedRoteiroKeys([]); // Limpar seleção
  }}
/>
```

---

### Arquivo a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/components/mentorados/MentoradoRoteirosView.tsx` | 1. Renomear estado para `selectedRoteiroKeys`<br>2. Adicionar Checkbox ao lado de cada HEADLINE<br>3. Adicionar título clicável "Gerar roteiro" no topo |

---

### Remover da Lista Separada

Remover o `MentoradoHeadlinesList` do checklist lateral, já que agora a seleção é feita diretamente nos campos de headline.

---

### Comportamento

1. **Usuário marca checkboxes** nos roteiros que quer usar
2. **Título "Gerar roteiro" aparece** no topo do documento
3. **Ao clicar**, abre dialog para escolher tipo de roteiro
4. **Após confirmar**, sistema recebe: tipo escolhido + conteúdo dos roteiros selecionados

---

### Imports Necessários

```tsx
import { Checkbox } from "@/components/ui/checkbox";
```

