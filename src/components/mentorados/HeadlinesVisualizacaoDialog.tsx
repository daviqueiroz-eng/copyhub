import { useEffect, useMemo, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GripVertical, Loader2, Save, Swords } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useReorderRoteiros, useUpsertMentoradoRoteiro, markLocalWrite } from "@/hooks/useMentoradosRoteiros";
import { useTiposRoteiro } from "@/hooks/useTiposRoteiro";
import { toast } from "@/hooks/use-toast";
import { useDispararVotacao, useMinhasVotacoes } from "@/hooks/useHeadlineVotacoes";
import { ResultadosVotacaoDialog } from "@/components/mentorados/ResultadosVotacaoDialog";

export type HeadlineVisualItem = {
  ordem: number;
  headline: string;
  estrutura: string;
  tipo_roteiro_id: string | null;
  link_referencia: string | null;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentoradoId: string;
  guiaNumero: number;
  items: HeadlineVisualItem[];
  onReordered?: () => void;
}

function SortableRow({
  item,
  index,
  editable,
  onChangeHeadline,
  onDispararVotacao,
}: {
  item: HeadlineVisualItem;
  index: number;
  editable?: boolean;
  onChangeHeadline?: (ordem: number, novo: string) => void;
  onDispararVotacao?: (item: HeadlineVisualItem) => void;
}) {
  const { data: tipos = [] } = useTiposRoteiro();
  const tipo = tipos.find((t) => t.id === item.tipo_roteiro_id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: String(item.ordem) });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const num = String(index + 1).padStart(2, "0");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-start gap-3 rounded-md border bg-card px-3 py-3 hover:bg-accent/40"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="mt-1 cursor-grab text-muted-foreground hover:text-foreground"
        title="Arrastar para reordenar"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-xs font-bold tracking-wide"
            style={{ color: "#B8860B" }}
          >
            HEADLINE {num}:
          </span>
          {tipo && (
            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
              {tipo.nome}
            </span>
          )}
          {onDispararVotacao && (
            <button
              type="button"
              onClick={() => onDispararVotacao(item)}
              className="ml-auto inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:border-foreground transition"
              title="Disparar votação (3 min)"
            >
              <Swords className="h-3 w-3" />
              Votar
            </button>
          )}
        </div>
        {editable ? (
          <textarea
            value={item.headline ?? ""}
            onChange={(e) =>
              onChangeHeadline?.(item.ordem, e.target.value)
            }
            placeholder="— vazio —"
            rows={1}
            className="w-full resize-none bg-transparent text-sm text-foreground outline-none focus:ring-1 focus:ring-ring rounded px-1 py-0.5 min-h-[28px]"
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = el.scrollHeight + "px";
            }}
            ref={(el) => {
              if (el) {
                el.style.height = "auto";
                el.style.height = el.scrollHeight + "px";
              }
            }}
          />
        ) : (
          <p className="text-sm text-foreground whitespace-pre-wrap break-words">
            {item.headline?.trim() || (
              <span className="text-muted-foreground italic">— vazio —</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

export const HeadlinesVisualizacaoDialog = ({
  open,
  onOpenChange,
  mentoradoId,
  guiaNumero,
  items,
  onReordered,
}: Props) => {
  const [ordered, setOrdered] = useState<HeadlineVisualItem[]>(items);
  const reorder = useReorderRoteiros();

  useEffect(() => {
    if (open) setOrdered(items);
  }, [open, items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const ids = useMemo(() => ordered.map((i) => String(i.ordem)), [ordered]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ordered.findIndex((i) => String(i.ordem) === active.id);
    const newIndex = ordered.findIndex((i) => String(i.ordem) === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setOrdered((prev) => arrayMove(prev, oldIndex, newIndex));
  };

  const isDirty = useMemo(() => {
    return ordered.some((it, i) => items[i]?.ordem !== it.ordem);
  }, [ordered, items]);

  const handleSaveAndClose = async () => {
    if (!isDirty) {
      onOpenChange(false);
      return;
    }
    try {
      await reorder.mutateAsync({
        mentoradoId,
        guiaNumero,
        newOrder: ordered.map((it) => ({
          headline: it.headline,
          estrutura: it.estrutura,
          tipo_roteiro_id: it.tipo_roteiro_id,
          link_referencia: it.link_referencia,
        })),
      });
      toast({ title: "Ordem das headlines salva" });
      onReordered?.();
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: "Erro ao salvar ordem",
        description: e?.message ?? "Tente novamente",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && reorder.isPending) return;
        onOpenChange(o);
      }}
    >
      <DialogContent
        className="max-w-2xl"
        style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
      >
        <DialogHeader>
          <DialogTitle>Visualização de headlines — Guia {guiaNumero}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {ordered.map((it, idx) => (
                  <SortableRow key={it.ordem} item={it} index={idx} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </ScrollArea>
        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={reorder.isPending}
          >
            Fechar
          </Button>
          <Button onClick={handleSaveAndClose} disabled={reorder.isPending || !isDirty}>
            {reorder.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar ordem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface PanelProps {
  mentoradoId: string;
  guiaNumero: number;
  items: HeadlineVisualItem[];
  onClose: () => void;
}

export const HeadlinesVisualizacaoPanel = ({
  mentoradoId,
  guiaNumero,
  items,
  onClose,
}: PanelProps) => {
  const [ordered, setOrdered] = useState<HeadlineVisualItem[]>(items);
  const reorder = useReorderRoteiros();
  const upsert = useUpsertMentoradoRoteiro();
  const disparar = useDispararVotacao();
  const { data: minhasVotacoes = [] } = useMinhasVotacoes();
  const [resultadosOpen, setResultadosOpen] = useState(false);
  const debounceTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  useEffect(() => {
    setOrdered(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, guiaNumero]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const ids = useMemo(() => ordered.map((i) => String(i.ordem)), [ordered]);

  const isDirty = useMemo(
    () => ordered.some((it, i) => items[i]?.ordem !== it.ordem),
    [ordered, items]
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ordered.findIndex((i) => String(i.ordem) === active.id);
    const newIndex = ordered.findIndex((i) => String(i.ordem) === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const novo = arrayMove(ordered, oldIndex, newIndex);
    setOrdered(novo);
    try {
      await reorder.mutateAsync({
        mentoradoId,
        guiaNumero,
        newOrder: novo.map((it) => ({
          headline: it.headline,
          estrutura: it.estrutura,
          tipo_roteiro_id: it.tipo_roteiro_id,
          link_referencia: it.link_referencia,
        })),
      });
    } catch (e: any) {
      toast({
        title: "Erro ao salvar ordem",
        description: e?.message ?? "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleChangeHeadline = (ordem: number, novo: string) => {
    setOrdered((prev) =>
      prev.map((it) => (it.ordem === ordem ? { ...it, headline: novo } : it))
    );
    const existing = debounceTimers.current.get(ordem);
    if (existing) clearTimeout(existing);
    const t = setTimeout(async () => {
      const current = ordered.find((it) => it.ordem === ordem);
      const itemToSave =
        ordered.find((it) => it.ordem === ordem) ?? current;
      const target =
        // pegar valor mais recente do estado
        novo;
      try {
        markLocalWrite();
        await upsert.mutateAsync({
          mentoradoId,
          guiaNumero,
          ordem,
          headline: target,
          estrutura: itemToSave?.estrutura ?? "",
          tipoRoteiroId: itemToSave?.tipo_roteiro_id ?? null,
          linkReferencia: itemToSave?.link_referencia ?? null,
        });
      } catch (e: any) {
        toast({
          title: "Erro ao salvar headline",
          description: e?.message ?? "Tente novamente",
          variant: "destructive",
        });
      }
      debounceTimers.current.delete(ordem);
    }, 800);
    debounceTimers.current.set(ordem, t);
  };

  const handleDisparar = async (it: HeadlineVisualItem) => {
    try {
      await disparar.mutateAsync({
        mentoradoId,
        guiaNumero,
        ordem: it.ordem,
        headline: it.headline ?? "",
      });
      toast({ title: "Votação disparada (3 min)" });
    } catch (e: any) {
      toast({
        title: "Erro ao disparar votação",
        description: e?.message ?? "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const naoVistos = minhasVotacoes.filter(
    (d) => !d.visualizada && d.votos.length > 0
  ).length;

  return (
    <div
      className="max-w-3xl mx-auto"
      style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          Visualização de headlines — Guia {guiaNumero}
        </h2>
        <div className="flex items-center gap-2">
          {reorder.isPending && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {isDirty && !reorder.isPending && (
            <span className="text-xs text-muted-foreground">Salvando...</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setResultadosOpen(true)}
            className="relative"
            title="Resultados das minhas votações"
          >
            <Swords className="h-4 w-4 mr-1" />
            Resultados
            {naoVistos > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none">
                +{naoVistos}
              </span>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            Voltar para edição
          </Button>
        </div>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {ordered.map((it, idx) => (
              <SortableRow
                key={it.ordem}
                item={it}
                index={idx}
                editable
                onChangeHeadline={handleChangeHeadline}
                onDispararVotacao={handleDisparar}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <ResultadosVotacaoDialog
        open={resultadosOpen}
        onOpenChange={setResultadosOpen}
      />
    </div>
  );
};