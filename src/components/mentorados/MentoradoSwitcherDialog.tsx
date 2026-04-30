import { useState, useMemo, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, Map, FileText, Megaphone, Zap, MessageSquare, Hash, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export type SwitcherShortcut =
  | "mapa_avatar"
  | "headlines"
  | "ctas"
  | "intensificadores"
  | "prompts"
  | "registrar_heads"
  | "termos_virais"
  | "virais";

interface Mentorado {
  id: string;
  nome: string;
  iniciais: string;
  avatar?: string | null;
}

interface MentoradoSwitcherDialogProps {
  open: boolean;
  onClose: () => void;
  mentorados: Mentorado[];
  currentMentoradoId: string;
  onSelectMentorado: (m: Mentorado) => void;
  onSelectShortcut: (s: SwitcherShortcut) => void;
}

const SHORTCUTS: Array<{
  key: SwitcherShortcut;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  command: string;
  searchTerms: string;
}> = [
  { key: "mapa_avatar", icon: Map, label: "Mapa do avatar", description: "Abrir mapa do avatar", command: "/", searchTerms: "mapa avatar" },
  { key: "headlines", icon: FileText, label: "Headlines", description: "Ir para headlines", command: "/3", searchTerms: "headlines" },
  { key: "ctas", icon: Megaphone, label: "CTAs", description: "Gerenciar CTAs", command: "/c", searchTerms: "ctas call to action" },
  { key: "intensificadores", icon: Zap, label: "Intensificadores", description: "Gerenciar intensificadores", command: "/i", searchTerms: "intensificadores" },
  { key: "prompts", icon: MessageSquare, label: "Prompts", description: "Abrir prompts", command: "/p", searchTerms: "prompts" },
  { key: "registrar_heads", icon: Hash, label: "Registrar heads", description: "Registrar novas heads", command: "/m", searchTerms: "registrar heads mentorados" },
  { key: "virais", icon: Flame, label: "Virais", description: "Banco de virais", command: "/v", searchTerms: "virais banco" },
  { key: "termos_virais", icon: Flame, label: "Termos virais", description: "Ver termos virais", command: "/t", searchTerms: "termos virais" },
];

export const MentoradoSwitcherDialog = ({
  open,
  onClose,
  mentorados,
  currentMentoradoId,
  onSelectMentorado,
  onSelectShortcut,
}: MentoradoSwitcherDialogProps) => {
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearch("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filteredMentorados = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return mentorados;
    return mentorados.filter((m) => m.nome.toLowerCase().includes(q));
  }, [mentorados, search]);

  const filteredShortcuts = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return SHORTCUTS;
    return SHORTCUTS.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.command.toLowerCase().includes(q) ||
        s.searchTerms.includes(q)
    );
  }, [search]);

  // Combined flat list for keyboard navigation
  const flatItems = useMemo(
    () => [
      ...filteredMentorados.map((m) => ({ kind: "mentorado" as const, data: m })),
      ...filteredShortcuts.map((s) => ({ kind: "shortcut" as const, data: s })),
    ],
    [filteredMentorados, filteredShortcuts]
  );

  useEffect(() => {
    if (activeIndex >= flatItems.length) setActiveIndex(0);
  }, [flatItems.length, activeIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % Math.max(flatItems.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + flatItems.length) % Math.max(flatItems.length, 1));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      // jump to next group
      const cur = flatItems[activeIndex];
      if (cur?.kind === "mentorado") {
        const idx = flatItems.findIndex((it) => it.kind === "shortcut");
        if (idx >= 0) setActiveIndex(idx);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const idx = flatItems.findIndex((it) => it.kind === "mentorado");
      if (idx >= 0) setActiveIndex(idx);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatItems[activeIndex];
      if (!item) return;
      if (item.kind === "mentorado") {
        if (item.data.id !== currentMentoradoId) onSelectMentorado(item.data);
        onClose();
      } else {
        onSelectShortcut(item.data.key);
        onClose();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="p-0 max-w-2xl gap-0 overflow-hidden">
        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar mentorado ou usar atalho..."
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">esc</kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {/* Mentorados */}
          {filteredMentorados.length > 0 && (
            <div className="p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1 mb-2">
                Mentorados
              </p>
              <div className="flex flex-wrap gap-2">
                {filteredMentorados.map((m, i) => {
                  const flatIdx = i;
                  const isActive = activeIndex === flatIdx;
                  const isCurrent = m.id === currentMentoradoId;
                  return (
                    <button
                      key={m.id}
                      onMouseEnter={() => setActiveIndex(flatIdx)}
                      onClick={() => {
                        if (!isCurrent) onSelectMentorado(m);
                        onClose();
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-2 rounded-lg w-[78px] transition-all",
                        isActive ? "bg-accent ring-2 ring-primary" : "hover:bg-accent/50",
                        isCurrent && !isActive && "ring-1 ring-primary/40"
                      )}
                    >
                      {m.avatar ? (
                        <img src={m.avatar} alt={m.nome} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">
                          {m.iniciais}
                        </div>
                      )}
                      <span className="text-[11px] font-medium truncate w-full text-center">
                        {m.nome.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Atalhos */}
          {filteredShortcuts.length > 0 && (
            <div className="p-3 border-t">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1 mb-2">
                Atalhos
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {filteredShortcuts.map((s, i) => {
                  const flatIdx = filteredMentorados.length + i;
                  const isActive = activeIndex === flatIdx;
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.key}
                      onMouseEnter={() => setActiveIndex(flatIdx)}
                      onClick={() => {
                        onSelectShortcut(s.key);
                        onClose();
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                        isActive ? "bg-accent ring-1 ring-primary/40" : "hover:bg-accent/50"
                      )}
                    >
                      <div className="w-8 h-8 rounded-md bg-muted/60 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-foreground/80" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{s.label}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{s.description}</div>
                      </div>
                      <kbd className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded shrink-0">
                        {s.command}
                      </kbd>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {flatItems.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhum resultado.</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/20 text-[10px] text-muted-foreground">
          <span>
            <kbd className="font-mono">↑↓</kbd> navegar · <kbd className="font-mono">Enter</kbd> selecionar
          </span>
          <span>
            <kbd className="font-mono">tab</kbd> para fechar
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
