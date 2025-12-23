import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIntensificadores, useCTAs, HighlightItem } from "@/hooks/useAnalysisHighlights";

type SlashCommandMode = "menu" | "intensificadores" | "ctas" | string;

interface AvatarCategory {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  items: string[];
}

interface SlashCommandPopoverProps {
  isOpen: boolean;
  mode: SlashCommandMode;
  onClose: () => void;
  onSelectItem: (text: string) => void;
  position: { top: number; left: number };
  avatarCategories?: AvatarCategory[];
}

export const SlashCommandPopover = ({
  isOpen,
  mode,
  onClose,
  onSelectItem,
  position,
  avatarCategories = [],
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

  const filterStringItems = (items: string[]) => {
    if (!search.trim()) return items;
    return items.filter((item) =>
      item.toLowerCase().includes(search.toLowerCase())
    );
  };

  // Categorias do avatar que têm pelo menos 1 item
  const categoriesWithItems = avatarCategories.filter((cat) => cat.items.length > 0);

  const renderMenu = () => (
    <div className="py-2">
      <p className="px-3 py-1 text-xs text-muted-foreground font-semibold">Análises de Roteiro</p>
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

      {categoriesWithItems.length > 0 && (
        <>
          <div className="my-2 border-t" />
          <p className="px-3 py-1 text-xs text-muted-foreground font-semibold">Mapa do Avatar</p>
          {categoriesWithItems.map((cat, index) => (
            <button
              key={cat.id}
              className="w-full text-left px-3 py-2 hover:bg-green-500 hover:text-white transition-colors flex items-center gap-2"
              onClick={() => handleCommandClick(`avatar_${cat.id}`)}
            >
              <span className="font-mono text-sm">/{index + 3}</span>
              <span className="truncate">{cat.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {cat.items.length} itens
              </span>
            </button>
          ))}
        </>
      )}
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

  const renderAvatarItems = (category: AvatarCategory) => {
    const filtered = filterStringItems(category.items);
    
    return (
      <div className="py-2">
        <p className="px-3 py-1 text-xs text-muted-foreground font-semibold flex items-center justify-between">
          <span>{category.name}</span>
          <button
            className="text-xs text-primary hover:underline"
            onClick={() => setInternalMode("menu")}
          >
            ← Voltar
          </button>
        </p>
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground text-center">
            Nenhum resultado para a busca.
          </p>
        ) : (
          <ScrollArea className="max-h-[250px]">
            {filtered.map((item, index) => (
              <button
                key={index}
                className="w-full text-left px-3 py-2 hover:bg-green-500 hover:text-white transition-colors"
                onClick={() => {
                  onSelectItem(item);
                  onClose();
                }}
              >
                <p className="text-sm">{item}</p>
              </button>
            ))}
          </ScrollArea>
        )}
      </div>
    );
  };

  // Encontrar categoria do avatar pelo mode
  const getAvatarCategory = () => {
    if (internalMode.startsWith("avatar_")) {
      const catId = internalMode.replace("avatar_", "");
      return avatarCategories.find((cat) => cat.id === catId);
    }
    return null;
  };

  const avatarCategory = getAvatarCategory();

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
      {avatarCategory && renderAvatarItems(avatarCategory)}
    </div>
  );
};
