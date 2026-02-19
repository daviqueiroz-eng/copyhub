import React, { useState, useEffect, useCallback, useRef } from "react";
import { BookOpen, X, Copy, GripHorizontal } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { useMentoradoNotas } from "@/hooks/useMentoradoNotas";

interface Mentorado {
  id: string;
  nome: string;
  iniciais: string;
  avatar?: string | null;
}

interface FloatingNotesPanelProps {
  currentMentoradoId: string;
  currentMentoradoNome: string;
  mentorados: Mentorado[];
}

export const FloatingNotesPanel: React.FC<FloatingNotesPanelProps> = ({
  currentMentoradoId,
  currentMentoradoNome,
  mentorados,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMentoradoId, setSelectedMentoradoId] = useState(currentMentoradoId);
  const [localContent, setLocalContent] = useState("");
  const [position, setPosition] = useState({ x: window.innerWidth - 620, y: 100 });
  const [size, setSize] = useState({ width: 560, height: 420 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const dragOffset = useRef({ x: 0, y: 0 });
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const { notas, upsertNota, getNotaForMentorado } = useMentoradoNotas();

  const selectedMentorado = mentorados.find((m) => m.id === selectedMentoradoId);

  // Sync content when switching mentorado
  useEffect(() => {
    const nota = getNotaForMentorado(selectedMentoradoId);
    setLocalContent(nota?.conteudo || "");
  }, [selectedMentoradoId, notas]);

  // Update selected when parent changes
  useEffect(() => {
    setSelectedMentoradoId(currentMentoradoId);
  }, [currentMentoradoId]);

  // Auto-save with debounce
  const handleContentChange = useCallback(
    (value: string) => {
      setLocalContent(value);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        upsertNota.mutate({ mentoradoId: selectedMentoradoId, conteudo: value });
      }, 1500);
    },
    [selectedMentoradoId, upsertNota]
  );

  // Drag handlers
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      setIsDragging(true);
      dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    },
    [position]
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging]);

  // Resize handlers
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      resizeStart.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height };
    },
    [size]
  );

  useEffect(() => {
    if (!isResizing) return;
    const handleMove = (e: MouseEvent) => {
      const newW = Math.max(400, resizeStart.current.w + (e.clientX - resizeStart.current.x));
      const newH = Math.max(300, resizeStart.current.h + (e.clientY - resizeStart.current.y));
      setSize({ width: newW, height: newH });
    };
    const handleUp = () => setIsResizing(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isResizing]);

  const handleCopy = () => {
    navigator.clipboard.writeText(localContent);
    toast({ title: "Copiado!", description: "Conteúdo copiado para a área de transferência" });
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
        >
          <BookOpen size={24} />
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div
          className="fixed z-50 rounded-xl border bg-background shadow-2xl flex overflow-hidden"
          style={{
            left: position.x,
            top: position.y,
            width: size.width,
            height: size.height,
            userSelect: isDragging || isResizing ? "none" : "auto",
          }}
        >
          {/* Sidebar */}
          {showSidebar && (
            <div className="w-[180px] border-r bg-muted/30 flex flex-col shrink-0">
              <div className="p-2 border-b">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Mentorados
                </span>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-1">
                  {mentorados.map((m) => {
                    const nota = getNotaForMentorado(m.id);
                    const preview = nota?.conteudo?.substring(0, 40) || "Sem notas";
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMentoradoId(m.id)}
                        className={`w-full text-left p-2 rounded-lg mb-0.5 transition-colors ${
                          m.id === selectedMentoradoId
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {m.avatar ? (
                            <img src={m.avatar} className="w-6 h-6 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                              {m.iniciais}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{m.nome.split(" ")[0]}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{preview}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Main area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Title bar - draggable */}
            <div
              className="flex items-center justify-between px-3 py-2 border-b bg-muted/20 cursor-grab active:cursor-grabbing shrink-0"
              onMouseDown={handleDragStart}
            >
              <div className="flex items-center gap-2 min-w-0">
                <GripHorizontal size={14} className="text-muted-foreground shrink-0" />
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ☰
                </button>
                <BookOpen size={14} className="text-primary shrink-0" />
                <span className="text-sm font-medium truncate">
                  {selectedMentorado?.nome || currentMentoradoNome}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  title="Copiar conteúdo"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  title="Minimizar"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Text area */}
            <textarea
              value={localContent}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Escreva suas anotações aqui..."
              className="flex-1 w-full p-4 bg-transparent border-0 outline-none resize-none text-sm leading-relaxed placeholder:text-muted-foreground/50"
              style={{ fontFamily: "'SF Pro Text', -apple-system, system-ui, sans-serif" }}
            />

            {/* Status bar */}
            <div className="flex items-center justify-between px-3 py-1 border-t bg-muted/10 text-[10px] text-muted-foreground">
              <span>{upsertNota.isPending ? "Salvando..." : "Salvo"}</span>
              <span>{localContent.length} caracteres</span>
            </div>
          </div>

          {/* Resize handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
            onMouseDown={handleResizeStart}
            style={{
              background: "linear-gradient(135deg, transparent 50%, hsl(var(--border)) 50%)",
              borderRadius: "0 0 0.75rem 0",
            }}
          />
        </div>
      )}
    </>
  );
};
