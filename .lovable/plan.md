

## Plano: Novo Ícone de Cópia Formatada (quando estrutura preenchida)

### Resumo

Adicionar um novo ícone de cópia na barra de ferramentas flutuante à direita de cada roteiro. Este ícone:
1. **Só aparece** quando o campo "estrutura" está preenchido
2. Fica posicionado **abaixo do ícone de teleprompter** (vídeo)
3. Copia em um **formato simplificado**:
   ```
   headline: [texto da headline]

   Estrutura:
   [texto da estrutura]
   ```

---

### Arquivo a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Adicionar função de cópia e novo botão condicional |

---

### 1. Nova Função de Cópia Formatada

Adicionar após a função `handleCopyRoteiro` (linha ~1306):

```typescript
const handleCopyRoteiroSimplificado = async (guiaNumero: number, ordem: number) => {
  const key = `${guiaNumero}-${ordem}`;
  const roteiro = roteirosLocais.get(key);
  
  if (!roteiro?.estrutura) {
    toast({
      title: "Estrutura vazia",
      description: "Preencha a estrutura antes de copiar.",
    });
    return;
  }

  // Formato simplificado conforme solicitado
  const plainText = `headline: ${roteiro.headline || ''}\n\nEstrutura:\n${roteiro.estrutura}`;

  try {
    await navigator.clipboard.writeText(plainText);
    toast({
      title: "Copiado!",
      description: "Headline e estrutura copiadas no formato simplificado.",
    });
  } catch {
    toast({
      title: "Erro",
      description: "Não foi possível copiar.",
      variant: "destructive",
    });
  }
};
```

---

### 2. Novo Botão na Barra de Ferramentas

Adicionar após o botão do Teleprompter (linha ~2353), dentro do div da toolbar flutuante:

```tsx
{/* Botão de cópia simplificada - só aparece quando estrutura preenchida */}
{roteiro.estrutura?.trim() && (
  <Button
    variant="ghost"
    size="icon"
    className="h-8 w-8 sm:h-7 sm:w-7"
    title="Copiar headline + estrutura"
    onClick={() => handleCopyRoteiroSimplificado(guiaAtiva, ordem)}
  >
    <ClipboardCopy className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
  </Button>
)}
```

**Ícone escolhido:** `ClipboardCopy` do Lucide (diferente do `Copy` já usado para distinguir as funções)

---

### 3. Import do Ícone

Verificar se `ClipboardCopy` já está importado, caso contrário adicionar ao import do Lucide:

```typescript
import { ..., ClipboardCopy, ... } from "lucide-react";
```

---

### Fluxo Visual

**Antes (estrutura vazia):**
```text
Barra lateral:
[📋 Copiar]
[🗑️ Deletar]
[⚙️ Config TTS]
[🔊 Ler]
[📹 Teleprompter]
```

**Depois (estrutura preenchida):**
```text
Barra lateral:
[📋 Copiar]
[🗑️ Deletar]
[⚙️ Config TTS]
[🔊 Ler]
[📹 Teleprompter]
[📄 Copiar Simplificado] <- NOVO (só aparece com estrutura)
```

---

### Formato da Cópia

**Entrada:**
- Headline: "3 livros que você precisa ler"
- Estrutura: "E o que poucos sabem é que existe uma diferença brutal..."

**Saída (clipboard):**
```
headline: 3 livros que você precisa ler

Estrutura:
E o que poucos sabem é que existe uma diferença brutal...
```

---

### Benefícios

1. **Cópia rápida**: Um clique para formato simplificado
2. **Condicional**: Só aparece quando faz sentido (estrutura preenchida)
3. **Diferenciado**: Ícone diferente do "Copiar" padrão para evitar confusão
4. **Formato limpo**: Sem formatação HTML, ideal para colar em prompts ou documentos simples

