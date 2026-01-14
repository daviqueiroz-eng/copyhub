import { useState, useEffect, useRef } from "react";
import { Search, Plus, Pencil, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useIntensificadores, useCTAs, HighlightItem } from "@/hooks/useAnalysisHighlights";
import { usePrompts, Prompt } from "@/hooks/usePrompts";

type SlashCommandMode = "menu" | "intensificadores" | "ctas" | "prompts" | string;

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
  onAddAvatarItem?: (categoryId: string, text: string) => void;
  onEditAvatarItem?: (categoryId: string, oldText: string, newText: string) => void;
  onDeleteAvatarItem?: (categoryId: string, text: string) => void;
}

export const SlashCommandPopover = ({
  isOpen,
  mode,
  onClose,
  onSelectItem,
  position,
  avatarCategories = [],
  onAddAvatarItem,
  onEditAvatarItem,
  onDeleteAvatarItem,
}: SlashCommandPopoverProps) => {
  const [search, setSearch] = useState("");
  const [internalMode, setInternalMode] = useState<SlashCommandMode>(mode);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Estados para adicionar/editar itens
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState("");
  const [editingItem, setEditingItem] = useState<{ categoryId: string; oldText: string } | null>(null);
  const [editItemText, setEditItemText] = useState("");

  const { data: intensificadores = [] } = useIntensificadores();
  const { data: ctas = [] } = useCTAs();
  const { data: prompts = [] } = usePrompts();

  useEffect(() => {
    setInternalMode(mode);
    setSearch("");
    setAddingToCategory(null);
    setEditingItem(null);
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
        if (addingToCategory || editingItem) {
          setAddingToCategory(null);
          setEditingItem(null);
          setNewItemText("");
          setEditItemText("");
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, addingToCategory, editingItem]);

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

  // Categorias do avatar que têm pelo menos 1 item ou podem receber novos
  const categoriesWithItems = avatarCategories.filter((cat) => cat.items.length > 0 || onAddAvatarItem);

  // Agrupar todos os itens do Avatar para exibição direta
  const allAvatarItems = avatarCategories.flatMap(cat => 
    cat.items.map(item => ({ item, category: cat }))
  );

  const filterAllAvatarItems = () => {
    if (!search.trim()) return allAvatarItems;
    return allAvatarItems.filter(({ item }) =>
      item.toLowerCase().includes(search.toLowerCase())
    );
  };

  const handleAddItem = (categoryId: string) => {
    if (!newItemText.trim() || !onAddAvatarItem) return;
    onAddAvatarItem(categoryId, newItemText.trim());
    setNewItemText("");
    setAddingToCategory(null);
  };

  const handleSaveEdit = () => {
    if (!editingItem || !editItemText.trim() || !onEditAvatarItem) return;
    onEditAvatarItem(editingItem.categoryId, editingItem.oldText, editItemText.trim());
    setEditingItem(null);
    setEditItemText("");
  };

  const startEditing = (categoryId: string, text: string) => {
    setEditingItem({ categoryId, oldText: text });
    setEditItemText(text);
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

    // Se pesquisando, mostrar só as categorias com resultados
    // Se não pesquisando, mostrar todas as categorias (para poder adicionar)
    const categoriesToShow = search.trim() 
      ? Array.from(groupedItems.values())
      : avatarCategories.map(cat => ({
          category: cat,
          items: cat.items
        }));

    return (
      <div className="py-2 flex flex-col">
        <p className="px-3 py-1 text-xs text-muted-foreground font-semibold shrink-0">Mapa do Avatar</p>
        
        {categoriesToShow.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground text-center">
            {avatarCategories.length === 0 
              ? "Nenhum item no Mapa do Avatar." 
              : "Nenhum resultado encontrado."}
          </p>
        ) : (
          <div className="h-[400px] overflow-y-auto pr-1">
            {categoriesToShow.map(({ category, items }) => (
              <div key={category.id} className="mb-3">
                <div className="flex items-center justify-between px-3 py-1">
                  <p className="text-xs font-semibold" style={{ color: category.color }}>
                    {category.name} ({items.length})
                  </p>
                  {onAddAvatarItem && (
                    <button
                      className="p-1 hover:bg-primary/10 rounded transition-colors"
                      onClick={() => {
                        setAddingToCategory(category.id);
                        setNewItemText("");
                      }}
                      title="Adicionar item"
                    >
                      <Plus className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
                
                {/* Input para adicionar novo item */}
                {addingToCategory === category.id && (
                  <div className="flex gap-1 px-3 py-1">
                    <Input
                      value={newItemText}
                      onChange={e => setNewItemText(e.target.value)}
                      placeholder="Novo item..."
                      className="h-7 text-sm flex-1"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === "Enter") handleAddItem(category.id);
                        if (e.key === "Escape") {
                          setAddingToCategory(null);
                          setNewItemText("");
                        }
                      }}
                    />
                    <Button size="sm" className="h-7 px-2" onClick={() => handleAddItem(category.id)}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setAddingToCategory(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                
                {items.map((item, idx) => (
                  <div key={`${category.id}-${idx}`} className="group">
                    {editingItem?.categoryId === category.id && editingItem?.oldText === item ? (
                      <div className="flex gap-1 px-3 py-1">
                        <Input
                          value={editItemText}
                          onChange={e => setEditItemText(e.target.value)}
                          className="h-7 text-sm flex-1"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === "Enter") handleSaveEdit();
                            if (e.key === "Escape") {
                              setEditingItem(null);
                              setEditItemText("");
                            }
                          }}
                        />
                        <Button size="sm" className="h-7 px-2" onClick={handleSaveEdit}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingItem(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between px-4 py-1.5 hover:bg-primary/10 transition-colors">
                        <button
                          className="flex-1 text-left text-sm truncate"
                          onClick={() => {
                            onSelectItem(item);
                            onClose();
                          }}
                        >
                          {item}
                        </button>
                        {(onEditAvatarItem || onDeleteAvatarItem) && (
                          <div className="hidden group-hover:flex items-center gap-0.5 ml-2">
                            {onEditAvatarItem && (
                              <button
                                className="p-1 hover:bg-background rounded transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(category.id, item);
                                }}
                                title="Editar"
                              >
                                <Pencil className="h-3 w-3 text-muted-foreground" />
                              </button>
                            )}
                            {onDeleteAvatarItem && (
                              <button
                                className="p-1 hover:bg-destructive/10 rounded transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteAvatarItem(category.id, item);
                                }}
                                title="Remover"
                              >
                                <X className="h-3 w-3 text-destructive" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="border-t mt-2 pt-2 shrink-0">
          <p className="px-3 py-1 text-xs text-muted-foreground">
            <span className="font-mono">/1</span> Intensificadores, <span className="font-mono">/2</span> CTAs, <span className="font-mono">/3</span> Headlines ou <span className="font-mono">/p</span> Prompts
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
          <ScrollArea className="max-h-[350px]">
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
          <ScrollArea className="max-h-[350px]">
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

  const filterPrompts = (items: Prompt[]) => {
    if (!search.trim()) return items;
    return items.filter(
      (item) =>
        item.titulo.toLowerCase().includes(search.toLowerCase()) ||
        item.descricao.toLowerCase().includes(search.toLowerCase()) ||
        item.nicho.toLowerCase().includes(search.toLowerCase())
    );
  };

  const renderPrompts = () => {
    const filtered = filterPrompts(prompts);
    
    return (
      <div className="py-2">
        <p className="px-3 py-1 text-xs text-muted-foreground font-semibold flex items-center justify-between">
          <span>Banco de Prompts ({filtered.length})</span>
          <button
            className="text-xs text-primary hover:underline"
            onClick={() => setInternalMode("menu")}
          >
            ← Voltar
          </button>
        </p>
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground text-center">
            Nenhum prompt encontrado.
          </p>
        ) : (
          <ScrollArea className="max-h-[400px]">
            {filtered.map((prompt) => (
              <button
                key={prompt.id}
                className="w-full text-left px-3 py-3 hover:bg-primary/10 transition-colors border-b border-border/50 last:border-0"
                onClick={() => {
                  navigator.clipboard.writeText(prompt.conteudo);
                  onClose();
                }}
                title="Clique para copiar"
              >
                <p className="text-sm font-medium line-clamp-1">{prompt.titulo}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{prompt.descricao}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                  {prompt.nicho}
                </span>
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
      className="fixed z-[100] bg-background border rounded-lg shadow-lg w-96"
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
      {internalMode === "prompts" && renderPrompts()}
      {avatarCategory && renderAvatarItems(avatarCategory)}
    </div>
  );
};
