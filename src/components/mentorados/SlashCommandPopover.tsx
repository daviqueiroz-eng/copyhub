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

  // Agrupar todos os itens do Avatar para exibição direta
  const allAvatarItems = categoriesWithItems.flatMap(cat => 
    cat.items.map(item => ({ item, category: cat }))
  );

  const filterAllAvatarItems = () => {
    if (!search.trim()) return allAvatarItems;
    return allAvatarItems.filter(({ item }) =>
      item.toLowerCase().includes(search.toLowerCase())
    );
  };

  const renderMenu = () => {
    const filteredAvatarItems = filterAllAvatarItems();
    
    // Agrupar itens filtrados por categoria
    const groupedItems = new Map<string, { category: AvatarCategory; items: string[] }>();
    filteredAvatarItems.forEach(({ item, category }) => {
      if (!groupedItems.has(category.id)) {
        groupedItems.set(category.id, { category, items: [] });
      }
      groupedItems.get(category.id)!.items.push(item);
    });

    return (
      <div className="py-2 flex flex-col">
        <p className="px-3 py-1 text-xs text-muted-foreground font-semibold shrink-0">Mapa do Avatar</p>
        
        {groupedItems.size === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground text-center">
            {categoriesWithItems.length === 0 
              ? "Nenhum item no Mapa do Avatar." 
              : "Nenhum resultado encontrado."}
          </p>
        ) : (
          <div className="h-[280px] overflow-y-auto pr-1">
            {Array.from(groupedItems.values()).map(({ category, items }) => (
              <div key={category.id} className="mb-2">
                <p className="px-3 py-1 text-xs font-semibold" style={{ color: category.color }}>
                  {category.name} ({items.length})
                </p>
                {items.map((item, idx) => (
                  <button
                    key={`${category.id}-${idx}`}
                    className="w-full text-left px-4 py-1.5 hover:bg-primary/10 transition-colors text-sm"
                    onClick={() => {
                      onSelectItem(item);
                      onClose();
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="border-t mt-2 pt-2 shrink-0">
          <p className="px-3 py-1 text-xs text-muted-foreground">
            Digite <span className="font-mono">/1</span> para Intensificadores, <span className="font-mono">/2</span> para CTAs ou <span className="font-mono">/3</span> para Headlines Aleatórias
          </p>
        </div>
      </div>
    );
  };

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
