

## Plano: Opções Condicionais e Renomeação/Reordenação de Guias

### Resumo das Mudanças

1. **Opção de Ajuste condicional**: O dialog `SelectionEditDialog` (que abre quando você seleciona texto) só aparecerá se a IA estiver habilitada
2. **Mensagem do cronômetro condicional**: O alerta de "ative o cronômetro" só aparecerá se o cronômetro estiver habilitado  
3. **Renomear guias**: Permitir clicar/duplo clique no nome da guia para editar
4. **Reordenar guias**: Permitir arrastar as guias para mudar a ordem

---

### 1. Adicionar Toggles de IA e Cronômetro

Adicionar dois estados de configuração no componente (salvos em localStorage para persistência):

**Arquivo:** `src/components/mentorados/MentoradoRoteirosView.tsx`

```typescript
// Novos estados
const [iaEnabled, setIaEnabled] = useState(() => {
  const saved = localStorage.getItem(`roteiro-ia-enabled-${mentoradoId}`);
  return saved !== null ? saved === "true" : true; // Default: habilitado
});

const [cronometroEnabled, setCronometroEnabled] = useState(() => {
  const saved = localStorage.getItem(`roteiro-cronometro-enabled-${mentoradoId}`);
  return saved !== null ? saved === "true" : true; // Default: habilitado
});

// Persistir no localStorage quando mudar
useEffect(() => {
  localStorage.setItem(`roteiro-ia-enabled-${mentoradoId}`, String(iaEnabled));
}, [iaEnabled, mentoradoId]);

useEffect(() => {
  localStorage.setItem(`roteiro-cronometro-enabled-${mentoradoId}`, String(cronometroEnabled));
}, [cronometroEnabled, mentoradoId]);
```

**UI dos Toggles na Sidebar (abaixo de Atalhos):**
```text
+---------------------------+
| Atalhos                   |
| / Mapa do avatar          |
| /c CTAs                   |
| /i Intensificadores       |
| /p Prompts                |
| /m Registrar heads        |
+---------------------------+
| Configurações             |
| [Switch] IA               |
| [Switch] Cronômetro       |
+---------------------------+
```

---

### 2. Condicionais para IA e Cronômetro

**SelectionEditDialog só abre se IA habilitada:**

Modificar o handler `onMouseUp` (linhas ~2184-2200):

```typescript
onMouseUp={(e) => {
  const target = e.currentTarget;
  const start = target.selectionStart;
  const end = target.selectionEnd;
  
  if (start !== end && end - start > 0) {
    const selectedText = target.value.substring(start, end);
    if (selectedText.trim().length > 0) {
      // SÓ ABRIR SE IA ESTIVER HABILITADA
      if (iaEnabled) {
        setSelectionEdit({
          open: true,
          text: selectedText,
          campo: "headline",
          roteiroKey: key,
          headline: roteiro.headline,
          estrutura: roteiro.estrutura,
        });
      }
    }
  }
}}
```

**Timer Alert só aparece se cronômetro habilitado:**

Modificar a função `checkTimerAndAlert` (linhas ~924-946):

```typescript
const checkTimerAndAlert = useCallback((field: "headline" | "estrutura") => {
  // SE CRONÔMETRO DESABILITADO, NÃO ALERTAR
  if (!cronometroEnabled) return;
  
  // Se o timer de revisão está ativo, não mostrar alerta
  if (timers["revisar"]?.isRunning) return;
  
  // ... resto da lógica
}, [timers, cronometroEnabled]);
```

Também modificar `checkAndShowTimerAlert` (se existir outra função similar).

---

### 3. Banco de Dados - Adicionar Colunas para Nome e Ordem

**Migração SQL:**
```sql
ALTER TABLE mentorados_guias_config 
ADD COLUMN IF NOT EXISTS nome_customizado TEXT,
ADD COLUMN IF NOT EXISTS ordem_personalizada INTEGER;

-- Inicializar ordem_personalizada com o número da guia
UPDATE mentorados_guias_config 
SET ordem_personalizada = numero 
WHERE ordem_personalizada IS NULL;
```

**Atualizar tipos no hook:**

**Arquivo:** `src/hooks/useGuiasConfig.ts`

```typescript
export interface GuiaConfig {
  id: string;
  user_id: string;
  mentorado_id: string;
  numero: number;
  quantidade: number;
  is_overdelivery: boolean;
  nome_customizado?: string | null;   // NOVO
  ordem_personalizada?: number | null; // NOVO
  created_at: string;
  updated_at: string;
}
```

Adicionar mutation para atualizar nome:
```typescript
export const useUpdateGuiaNome = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      mentorado_id: string;
      numero: number;
      nome_customizado: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("mentorados_guias_config")
        .update({ nome_customizado: data.nome_customizado })
        .eq("user_id", user.id)
        .eq("mentorado_id", data.mentorado_id)
        .eq("numero", data.numero);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["guias-config", variables.mentorado_id],
      });
    },
  });
};
```

---

### 4. Renomear Guias - UI

**Arquivo:** `src/components/mentorados/MentoradoRoteirosView.tsx`

Adicionar estado para edição de nome:
```typescript
const [editingGuiaNome, setEditingGuiaNome] = useState<number | null>(null);
const [tempGuiaNome, setTempGuiaNome] = useState("");
```

Modificar renderização das guias (linhas ~1838-1876):

```tsx
{guias.map((guia) => (
  <div key={guia.numero} className="group flex items-center gap-1">
    {editingGuiaNome === guia.numero ? (
      // Modo de edição
      <Input
        value={tempGuiaNome}
        onChange={(e) => setTempGuiaNome(e.target.value)}
        onBlur={() => {
          // Salvar nome
          if (tempGuiaNome.trim()) {
            updateGuiaNome.mutate({
              mentorado_id: mentoradoId,
              numero: guia.numero,
              nome_customizado: tempGuiaNome,
            });
          }
          setEditingGuiaNome(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
          if (e.key === "Escape") {
            setEditingGuiaNome(null);
          }
        }}
        className="h-8 text-sm"
        autoFocus
      />
    ) : (
      <Button
        variant={guiaAtiva === guia.numero ? "default" : "ghost"}
        className="flex-1 justify-center lg:justify-start gap-2 px-2 lg:px-4"
        onClick={() => handleGuiaChange(guia.numero)}
        onDoubleClick={() => {
          // Iniciar edição do nome
          setEditingGuiaNome(guia.numero);
          setTempGuiaNome(guia.nome_customizado || `Guia ${guia.numero}`);
        }}
      >
        {guia.isOverdelivery ? (
          <>
            <Package className="h-4 w-4" />
            <span className="hidden lg:inline">
              {guia.nome_customizado || "Overdelivery"}
            </span>
          </>
        ) : (
          <>
            <span className="lg:hidden">{guia.numero}</span>
            <span className="hidden lg:inline">
              {guia.nome_customizado || `Guia ${guia.numero}`}
            </span>
            <span className="ml-auto text-xs opacity-70 hidden lg:inline">
              {getFilledCount(guia.numero)}/{guia.quantidade}
            </span>
          </>
        )}
      </Button>
    )}
    {/* Botão delete igual ao atual */}
  </div>
))}
```

---

### 5. Reordenar Guias - Drag and Drop

Usar `@dnd-kit` já instalado no projeto para permitir arrastar guias:

```tsx
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Componente para guia arrastável
const SortableGuiaButton = ({ guia, isActive, onClick, onDoubleClick, ... }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: guia.numero,
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-center gap-1">
        <GripVertical {...listeners} className="h-4 w-4 cursor-grab" />
        <Button ...>
          {/* Conteúdo da guia */}
        </Button>
      </div>
    </div>
  );
};

// No componente principal
const handleDragEnd = (event) => {
  const { active, over } = event;
  if (active.id !== over?.id) {
    const oldIndex = guias.findIndex(g => g.numero === active.id);
    const newIndex = guias.findIndex(g => g.numero === over.id);
    const reordered = arrayMove(guias, oldIndex, newIndex);
    
    // Atualizar ordem_personalizada no banco
    reordered.forEach((guia, index) => {
      updateGuiaOrdem.mutate({
        mentorado_id: mentoradoId,
        numero: guia.numero,
        ordem_personalizada: index,
      });
    });
    
    setGuias(reordered);
  }
};
```

---

### Fluxo Visual

**Toggles na Sidebar:**
```text
+---------------------------+
| Guia 1          5/15      |  <- Duplo clique para renomear
| [==] Guia 2    10/15      |  <- Arraste o grip para reordenar
| Overdelivery              |
+---------------------------+
| Atalhos                   |
| / Mapa do avatar          |
| /c CTAs                   |
+---------------------------+
| Configurações             |
| IA:          [====O]      |  <- Toggle ON/OFF
| Cronômetro:  [O====]      |  <- Toggle ON/OFF
+---------------------------+
```

**Quando IA está OFF:**
- Selecionar texto não abre o dialog de edição
- Funcionalidades de IA ficam ocultas

**Quando Cronômetro está OFF:**
- Mensagem de "ative o cronômetro" não aparece
- Timers ainda funcionam, mas sem alertas

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useGuiasConfig.ts` | Adicionar `nome_customizado` e `ordem_personalizada` + mutations |
| `src/components/mentorados/MentoradoRoteirosView.tsx` | Toggles IA/Cronômetro, edição de nome, drag-and-drop |
| **Migração SQL** | Adicionar colunas `nome_customizado` e `ordem_personalizada` |

---

### Resumo de Benefícios

1. **Flexibilidade**: Usuário pode desativar IA ou alertas do cronômetro conforme preferência
2. **Personalização**: Cada guia pode ter um nome customizado (ex: "Headlines virais", "Estruturas longas")
3. **Organização**: Reordenar guias por prioridade ou fluxo de trabalho
4. **Persistência**: Configurações salvas por mentorado

