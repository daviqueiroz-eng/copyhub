import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIntensificadores, useCTAs, HighlightItem } from "@/hooks/useAnalysisHighlights";

type SlashCommandMode = "menu" | "intensificadores" | "ctas";

interface SlashCommandPopoverProps {
  isOpen: boolean;
  mode: SlashCommandMode;
  onClose: () => void;
  onSelectItem: (text: string) => void;
  position: { top: number; left: number };
}

export const SlashCommandPopover = ({
  isOpen,
  mode,
  onClose,
  onSelectItem,
  position,
}: SlashCommandPopoverProps) => {
  const [search, setSearch] = useState("");
  const [internalMode, setInternalMode] = useState<SlashCommandMode>(mode);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: intensificadores = [] } = useIntensificadores();
  const { data: ctas = [] } = useCTAs();

  useEffect(() => {
    setInternalMode(mode);
    setSearch("");
  }, [mode]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Fechar ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCommandClick = (cmd: SlashCommandMode) => {
    setInternalMode(cmd);
  };

  const filterItems = (items: HighlightItem[]) => {
    if (!search.trim()) return items;
    return items.filter(
      (item) =>
        item.texto.toLowerCase().includes(search.toLowerCase()) ||
        item.roteiroTitulo.toLowerCase().includes(search.toLowerCase())
    );
  };

  const renderMenu = () => (
    <div className="py-2">
      <p className="px-3 py-1 text-xs text-muted-foreground font-semibold">Comandos</p>
      <button
        className="w-full text-left px-3 py-2 hover:bg-green-500 hover:text-white transition-colors flex items-center gap-2"
        onClick={() => handleCommandClick("intensificadores")}
      >
        <span className="font-mono text-sm">/1</span>
        <span>Intensificadores</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {intensificadores.length} itens
        </span>
      </button>
      <button
        className="w-full text-left px-3 py-2 hover:bg-green-500 hover:text-white transition-colors flex items-center gap-2"
        onClick={() => handleCommandClick("ctas")}
      >
        <span className="font-mono text-sm">/2</span>
        <span>CTAs</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {ctas.length} itens
        </span>
      </button>
    </div>
  );

  const renderItems = (items: HighlightItem[], title: string) => {
    const filtered = filterItems(items);
    
    return (
      <div className="py-2">
        <p className="px-3 py-1 text-xs text-muted-foreground font-semibold flex items-center justify-between">
          <span>{title}</span>
          <button
            className="text-xs text-primary hover:underline"
            onClick={() => setInternalMode("menu")}
          >
            ← Voltar
          </button>
        </p>
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground text-center">
            {items.length === 0
              ? "Nenhum item encontrado nas suas análises."
              : "Nenhum resultado para a busca."}
          </p>
        ) : (
          <ScrollArea className="max-h-[250px]">
            {filtered.map((item) => (
              <button
                key={item.id}
                className="w-full text-left px-3 py-2 hover:bg-green-500 hover:text-white transition-colors"
                onClick={() => {
                  onSelectItem(item.texto);
                  onClose();
                }}
              >
                <p className="text-sm line-clamp-2">{item.texto}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.roteiroTitulo}
                </p>
              </button>
            ))}
          </ScrollArea>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="fixed z-[100] bg-background border rounded-lg shadow-lg w-80"
      style={{ top: position.top, left: position.left }}
    >
      {/* Campo de busca */}
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar item..."
            className="pl-8 h-8"
            autoFocus
          />
        </div>
      </div>

      {/* Conteúdo */}
      {internalMode === "menu" && renderMenu()}
      {internalMode === "intensificadores" && renderItems(intensificadores, "Intensificadores")}
      {internalMode === "ctas" && renderItems(ctas, "CTAs")}
    </div>
  );
};
