import { useEffect, useRef, useState } from "react";
import { Tldraw, Editor } from "tldraw";
import "tldraw/tldraw.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Pencil, Check, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useMapasMentais,
  useCreateMapaMental,
  useUpdateMapaMental,
  useDeleteMapaMental,
  MapaMental,
} from "@/hooks/useMapasMentais";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface Props {
  mentoradoId: string;
  readOnly?: boolean;
  initialSnapshot?: any;
  initialMapas?: Array<Pick<MapaMental, "id" | "nome">>;
  publicLoadSnapshot?: (mapaId: string) => Promise<any>;
}

export function MapaMentalView({
  mentoradoId,
  readOnly = false,
  initialMapas,
  publicLoadSnapshot,
}: Props) {
  const query = useMapasMentais(readOnly ? undefined : mentoradoId);
  const mapas: MapaMental[] = readOnly
    ? ((initialMapas as MapaMental[]) ?? [])
    : (query.data ?? []);

  const createMapa = useCreateMapaMental();
  const updateMapa = useUpdateMapaMental();
  const deleteMapa = useDeleteMapaMental();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<MapaMental | null>(null);
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved">("idle");
  const [publicSnapshot, setPublicSnapshot] = useState<any>(null);
  const [publicLoading, setPublicLoading] = useState(false);

  useEffect(() => {
    if (!activeId && mapas.length > 0) setActiveId(mapas[0].id);
    if (activeId && !mapas.find((m) => m.id === activeId)) {
      setActiveId(mapas[0]?.id ?? null);
    }
  }, [mapas, activeId]);

  const activeMapa = mapas.find((m) => m.id === activeId) || null;

  // Public read-only: load snapshot when active mapa changes
  useEffect(() => {
    if (!readOnly || !publicLoadSnapshot || !activeId) return;
    setPublicLoading(true);
    setPublicSnapshot(null);
    publicLoadSnapshot(activeId)
      .then((snap) => setPublicSnapshot(snap))
      .catch(() => setPublicSnapshot(null))
      .finally(() => setPublicLoading(false));
  }, [readOnly, publicLoadSnapshot, activeId]);

  const editorRef = useRef<Editor | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLoadedIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

  // Load snapshot when active mapa changes (edit mode)
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed || !activeMapa || readOnly) return;
    if (lastLoadedIdRef.current === activeMapa.id) return;
    isLoadingRef.current = true;
    try {
      if (activeMapa.snapshot) {
        ed.loadSnapshot(activeMapa.snapshot);
      } else {
        // Clear canvas for a fresh empty mapa
        const allShapes = ed.getCurrentPageShapes().map((s) => s.id);
        if (allShapes.length > 0) ed.deleteShapes(allShapes);
      }
      lastLoadedIdRef.current = activeMapa.id;
    } finally {
      // Allow one microtask before re-enabling autosave
      setTimeout(() => (isLoadingRef.current = false), 100);
    }
  }, [activeMapa, readOnly]);

  // Public snapshot load
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed || !readOnly || !publicSnapshot) return;
    try {
      ed.loadSnapshot(publicSnapshot);
      ed.updateInstanceState({ isReadonly: true });
    } catch {
      /* noop */
    }
  }, [publicSnapshot, readOnly]);

  const handleMount = (editor: Editor) => {
    editorRef.current = editor;
    if (readOnly) {
      editor.updateInstanceState({ isReadonly: true });
    }
    // Initial load if we already have activeMapa
    if (!readOnly && activeMapa) {
      isLoadingRef.current = true;
      try {
        if (activeMapa.snapshot) {
          editor.loadSnapshot(activeMapa.snapshot);
        }
        lastLoadedIdRef.current = activeMapa.id;
      } catch {
        /* noop */
      } finally {
        setTimeout(() => (isLoadingRef.current = false), 100);
      }
    }
    if (readOnly && publicSnapshot) {
      try {
        editor.loadSnapshot(publicSnapshot);
      } catch {
        /* noop */
      }
    }

    if (readOnly) return;

    // Autosave on any store change (debounced)
    editor.store.listen(
      () => {
        if (isLoadingRef.current) return;
        if (!activeMapa) return;
        setSavingState("saving");
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          const currentId = lastLoadedIdRef.current;
          if (!currentId) return;
          const snap = editor.getSnapshot();
          updateMapa.mutate(
            { id: currentId, mentorado_id: mentoradoId, patch: { snapshot: snap as any } },
            {
              onSuccess: () => {
                setSavingState("saved");
                setTimeout(
                  () => setSavingState((s) => (s === "saved" ? "idle" : s)),
                  1500
                );
              },
              onError: () => setSavingState("idle"),
            }
          );
        }, 1500);
      },
      { source: "user", scope: "document" }
    );
  };

  const handleCreate = () => {
    createMapa.mutate(
      { mentorado_id: mentoradoId, nome: `Mapa mental ${mapas.length + 1}` },
      {
        onSuccess: (novo) => {
          setActiveId(novo.id);
          lastLoadedIdRef.current = null;
          toast.success("Mapa mental criado");
        },
        onError: (e: any) => toast.error(e.message || "Erro ao criar"),
      }
    );
  };

  const handleRename = (mapa: MapaMental) => {
    if (!tempName.trim() || tempName === mapa.nome) {
      setEditingNameId(null);
      return;
    }
    updateMapa.mutate(
      { id: mapa.id, mentorado_id: mentoradoId, patch: { nome: tempName.trim() } },
      {
        onSuccess: () => {
          setEditingNameId(null);
          toast.success("Renomeado");
        },
      }
    );
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    deleteMapa.mutate(
      { id: confirmDelete.id, mentorado_id: mentoradoId },
      {
        onSuccess: () => {
          if (activeId === confirmDelete.id) {
            lastLoadedIdRef.current = null;
            setActiveId(null);
          }
          setConfirmDelete(null);
          toast.success("Mapa mental excluído");
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-background mapa-mental-root">
      {/* Barra compacta de mapas */}
      <div className="h-10 shrink-0 border-b bg-muted/30 flex items-center gap-2 px-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 max-w-[240px]">
              <span className="truncate text-sm">
                {activeMapa?.nome ?? (readOnly ? "Nenhum mapa" : "Selecionar mapa")}
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 max-h-80 overflow-y-auto">
            {mapas.length === 0 && (
              <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                {readOnly ? "Nenhum mapa disponível" : "Crie seu primeiro mapa mental"}
              </div>
            )}
            {mapas.map((m) => (
              <DropdownMenuItem
                key={m.id}
                onSelect={(e) => {
                  e.preventDefault();
                  if (editingNameId === m.id) return;
                  if (activeId !== m.id) {
                    lastLoadedIdRef.current = null;
                    setActiveId(m.id);
                  }
                }}
                className={cn(
                  "group flex items-center gap-1",
                  activeId === m.id && "bg-accent font-medium"
                )}
              >
                {editingNameId === m.id && !readOnly ? (
                  <>
                    <Input
                      autoFocus
                      value={tempName}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") handleRename(m);
                        if (e.key === "Escape") setEditingNameId(null);
                      }}
                      onBlur={() => handleRename(m)}
                      className="h-7 text-sm"
                    />
                  </>
                ) : (
                  <>
                    <span className="flex-1 truncate">{m.nome}</span>
                    {!readOnly && (
                      <>
                        <button
                          className="h-6 w-6 inline-flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-accent rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setEditingNameId(m.id);
                            setTempName(m.nome);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          className="h-6 w-6 inline-flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-accent rounded text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setConfirmDelete(m);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </>
                )}
              </DropdownMenuItem>
            ))}
            {!readOnly && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleCreate(); }}>
                  <Plus className="h-3.5 w-3.5 mr-2" /> Novo mapa mental
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {!readOnly && (
          <div className="ml-auto text-xs text-muted-foreground flex items-center gap-1 pr-2">
            {savingState === "saving" && (
              <><Loader2 className="h-3 w-3 animate-spin" /> Salvando…</>
            )}
            {savingState === "saved" && (
              <><Check className="h-3 w-3 text-green-600" /> Salvo</>
            )}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 min-w-0 min-h-0 relative">
        {mapas.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            {readOnly
              ? "Nenhum mapa mental foi criado ainda."
              : "Clique em + para criar seu primeiro mapa mental."}
          </div>
        ) : publicLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tldraw
            key={activeId ?? "empty"}
            onMount={handleMount}
            hideUi={false}
          />
        )}
      </div>

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir mapa mental?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.nome}" será excluído permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}