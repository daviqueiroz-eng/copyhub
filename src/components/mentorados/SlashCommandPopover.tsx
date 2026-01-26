import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Plus, Pencil, X, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIntensificadores, useCTAs, HighlightItem } from "@/hooks/useAnalysisHighlights";
import { usePrompts, Prompt } from "@/hooks/usePrompts";
import { useMentorados, Mentorado } from "@/hooks/useMentorados";
import { useCreateHeadlinesCriadas } from "@/hooks/useHeadlinesCriadas";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

type SlashCommandMode = "menu" | "intensificadores" | "ctas" | "prompts" | "mentorados" | string;

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
  
  // Estados para modo mentorados
  const [selectedMentorado, setSelectedMentorado] = useState<Mentorado | null>(null);
  const [headlineInput, setHeadlineInput] = useState("");

  const { data: intensificadores = [] } = useIntensificadores();
  const { data: ctas = [] } = useCTAs();
  const { data: prompts = [] } = usePrompts();
  const { data: mentorados = [] } = useMentorados();
  const createHeadline = useCreateHeadlinesCriadas();
  const { user } = useAuth();

  useEffect(() => {
    setInternalMode(mode);
    setSearch("");
    setAddingToCategory(null);
    setEditingItem(null);
    setSelectedMentorado(null);
    setHeadlineInput("");
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
            <span className="font-mono">/i</span> Intensificadores, <span className="font-mono">/c</span> CTAs, <span className="font-mono">/3</span> Headlines, <span className="font-mono">/p</span> Prompts, <span className="font-mono">/m</span> Mentorados
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

  // Função para salvar headline para mentorado
  const handleSaveHeadline = async () => {
    if (!selectedMentorado || !headlineInput.trim() || !user) return;
    
    try {
      await createHeadline.mutateAsync([{
        user_id: user.id,
        mentorado_id: selectedMentorado.id,
        headline: headlineInput.trim(),
      }]);
      
      toast({ 
        title: "Headline salva!", 
        description: `Para ${selectedMentorado.nome}` 
      });
      setHeadlineInput("");
      setSelectedMentorado(null);
      onClose();
    } catch (error) {
      // Erro já tratado pelo hook
    }
  };

  // Renderizar lista de mentorados
  const renderMentorados = () => {
    // Se tem mentorado selecionado, mostrar input para headline
    if (selectedMentorado) {
      return (
        <div className="p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={selectedMentorado.avatar || undefined} />
              <AvatarFallback className="text-xs bg-primary/10">
                {selectedMentorado.iniciais}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm flex-1">{selectedMentorado.nome}</span>
            <button
              className="p-1 hover:bg-muted rounded"
              onClick={() => {
                setSelectedMentorado(null);
                setHeadlineInput("");
              }}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <Textarea
            placeholder="Digite a headline..."
            value={headlineInput}
            onChange={(e) => setHeadlineInput(e.target.value)}
            className="min-h-[80px]"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) {
                e.preventDefault();
                handleSaveHeadline();
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Ctrl+Enter para salvar</span>
            <Button 
              size="sm"
              onClick={handleSaveHeadline}
              disabled={!headlineInput.trim() || createHeadline.isPending}
            >
              {createHeadline.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Salvar Headline
            </Button>
          </div>
        </div>
      );
    }
    
    // Lista de mentorados para selecionar
    const filtered = mentorados.filter(m =>
      m.nome.toLowerCase().includes(search.toLowerCase()) ||
      m.iniciais.toLowerCase().includes(search.toLowerCase()) ||
      (m.instagram && m.instagram.toLowerCase().includes(search.toLowerCase()))
    );
    
    return (
      <div className="py-2">
        <p className="px-3 py-1 text-xs text-muted-foreground font-semibold flex items-center justify-between">
          <span>Selecione um Mentorado ({filtered.length})</span>
          <button
            className="text-xs text-primary hover:underline"
            onClick={() => setInternalMode("menu")}
          >
            ← Voltar
          </button>
        </p>
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground text-center">
            {mentorados.length === 0 
              ? "Nenhum mentorado cadastrado."
              : "Nenhum resultado para a busca."}
          </p>
        ) : (
          <ScrollArea className="max-h-[350px]">
            {filtered.map((mentorado) => (
              <button
                key={mentorado.id}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-primary/10 transition-colors"
                onClick={() => setSelectedMentorado(mentorado)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={mentorado.avatar || undefined} />
                  <AvatarFallback className="text-xs bg-primary/10">
                    {mentorado.iniciais}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{mentorado.nome}</p>
                  {mentorado.instagram && (
                    <p className="text-xs text-muted-foreground truncate">@{mentorado.instagram}</p>
                  )}
                </div>
              </button>
            ))}
          </ScrollArea>
        )}
      </div>
    );
  };

  const avatarCategory = getAvatarCategory();

  // Calcular posição ajustada para não cortar em mobile
  const adjustedPosition = useMemo(() => {
    if (typeof window === "undefined") return position;
    
    const isMobile = window.innerWidth < 640;
    const popoverWidth = isMobile ? window.innerWidth - 32 : 384; // 384 = w-96
    
    let left = position.left;
    
    if (isMobile) {
      // Em mobile, centralizar com 16px de margem cada lado
      left = 16;
    } else {
      // Em desktop, garantir que não ultrapasse a tela
      const maxLeft = window.innerWidth - popoverWidth - 16;
      left = Math.max(16, Math.min(position.left, maxLeft));
    }
    
    // Ajustar altura também para não ultrapassar a parte inferior da tela
    let top = position.top;
    const maxHeight = 500; // Altura máxima aproximada do popover
    if (top + maxHeight > window.innerHeight) {
      // Se não couber abaixo, posicionar acima do cursor
      top = Math.max(16, position.top - maxHeight);
    }
    
    return { top, left };
  }, [position]);

  return (
    <div
      ref={containerRef}
      className="fixed z-[100] bg-background border rounded-lg shadow-lg w-[calc(100vw-32px)] sm:w-96 max-w-96"
      style={{ top: adjustedPosition.top, left: adjustedPosition.left }}
    >
      {/* Campo de busca - esconder quando estiver digitando headline */}
      {!(internalMode === "mentorados" && selectedMentorado) && (
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
      )}

      {/* Conteúdo */}
      {internalMode === "menu" && renderMenu()}
      {internalMode === "intensificadores" && renderItems(intensificadores, "Intensificadores")}
      {internalMode === "ctas" && renderItems(ctas, "CTAs")}
      {internalMode === "prompts" && renderPrompts()}
      {internalMode === "mentorados" && renderMentorados()}
      {avatarCategory && renderAvatarItems(avatarCategory)}
    </div>
  );
};
