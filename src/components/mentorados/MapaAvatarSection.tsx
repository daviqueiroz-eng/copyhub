import { useState } from "react";
import { ChevronRight, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface AvatarCategory {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  items: string[];
}

interface MapaAvatarSectionProps {
  categories: AvatarCategory[];
  onUpdateCategories: (categories: AvatarCategory[]) => void;
}

const defaultCategories: AvatarCategory[] = [
  { id: "desejos", name: "Desejos", subtitle: "(Gatilho da Recompensa)", color: "bg-green-100 border-green-200 text-green-800", items: [] },
  { id: "dores", name: "Problemas/Dores", subtitle: "(Gatilho da Recompensa)", color: "bg-yellow-100 border-yellow-200 text-yellow-800", items: [] },
  { id: "medos", name: "Medos", subtitle: "(Gatilho da Crença)", color: "bg-red-100 border-red-200 text-red-700", items: [] },
  { id: "situacoes", name: "Situações/Hábitos Comuns", subtitle: "(Gatilho do Reconhecimento)", color: "bg-orange-100 border-orange-200 text-orange-700", items: [] },
  { id: "filmes", name: "Filmes, Séries e Músicas Conhecidos pela Audiência", subtitle: "(Gatilho da Popularidade/Reputação)", color: "bg-teal-100 border-teal-200 text-teal-700", items: [] },
  { id: "tecnicas", name: "Técnicas/Procedimentos Conhecidos da Audiência", subtitle: "(Gatilho da Popularidade/Reputação)", color: "bg-pink-100 border-pink-200 text-pink-700", items: [] },
  { id: "pessoas", name: "Pessoas/Personagens Conhecidos pela Audiência", subtitle: "(Gatilho da Popularidade/Reputação)", color: "bg-rose-100 border-rose-200 text-rose-700", items: [] },
  { id: "instituicoes", name: "Instituições Conhecidas pela Audiência", subtitle: "(Gatilho da Popularidade/Reputação)", color: "bg-blue-100 border-blue-200 text-blue-700", items: [] },
  { id: "itens", name: "Item/Objetos/Ferramentas Comuns Usadas pela Audiência", subtitle: "(itens físicos, alimentos, aplicativos, sistemas, etc) (Gatilho da Popularidade/Reputação)", color: "bg-sky-100 border-sky-200 text-sky-700", items: [] },
  { id: "crencas", name: "Crenças da Audiência", subtitle: "(Gatilho da Crença)", color: "bg-indigo-100 border-indigo-200 text-indigo-700", items: [] },
  { id: "violacoes", name: "Que Comportamentos ou Situações Violam as Expectativas De Como o Mundo do Seu Avatar Deveria Funcionar", subtitle: "(Gatilho da Disrupção)", color: "bg-violet-100 border-violet-200 text-violet-700", items: [] },
  { id: "caracteristicas", name: "Características do Avatar?", subtitle: "(Gatilho do Reconhecimento)", color: "bg-purple-100 border-purple-200 text-purple-700", items: [] },
];

export function MapaAvatarSection({ categories, onUpdateCategories }: MapaAvatarSectionProps) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({});
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategorySubtitle, setNewCategorySubtitle] = useState("");

  // Use default categories if none provided
  const currentCategories = categories.length > 0 ? categories : defaultCategories;

  const toggleCategory = (id: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddItem = (categoryId: string) => {
    const text = newItemInputs[categoryId]?.trim();
    if (!text) return;

    const updated = currentCategories.map((cat) =>
      cat.id === categoryId ? { ...cat, items: [...cat.items, text] } : cat
    );
    onUpdateCategories(updated);
    setNewItemInputs((prev) => ({ ...prev, [categoryId]: "" }));
  };

  const handleRemoveItem = (categoryId: string, itemIndex: number) => {
    const updated = currentCategories.map((cat) =>
      cat.id === categoryId
        ? { ...cat, items: cat.items.filter((_, i) => i !== itemIndex) }
        : cat
    );
    onUpdateCategories(updated);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;

    const newCategory: AvatarCategory = {
      id: `custom_${Date.now()}`,
      name: newCategoryName.trim(),
      subtitle: newCategorySubtitle.trim() || "",
      color: "bg-gray-100 border-gray-200 text-gray-700",
      items: [],
    };

    onUpdateCategories([...currentCategories, newCategory]);
    setNewCategoryName("");
    setNewCategorySubtitle("");
    setShowNewCategoryDialog(false);
  };

  const handleRemoveCategory = (categoryId: string) => {
    onUpdateCategories(currentCategories.filter((cat) => cat.id !== categoryId));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Mapa do avatar</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowNewCategoryDialog(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nova categoria
        </Button>
      </div>

      <div className="space-y-2">
        {currentCategories.map((category) => (
          <Collapsible
            key={category.id}
            open={openCategories.has(category.id)}
            onOpenChange={() => toggleCategory(category.id)}
          >
            <CollapsibleTrigger asChild>
              <div
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${category.color}`}
              >
                <div className="flex items-center gap-2">
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      openCategories.has(category.id) ? "rotate-90" : ""
                    }`}
                  />
                  <span className="font-medium">{category.name}</span>
                  <span className="text-sm opacity-70">{category.subtitle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{category.items.length}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCategory(category.id);
                    }}
                    className="opacity-60 hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="pl-6 pr-2 py-2 space-y-2">
              {category.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-background rounded border"
                >
                  <span className="text-sm">{item}</span>
                  <button
                    onClick={() => handleRemoveItem(category.id, index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              <div className="flex gap-2">
                <Input
                  value={newItemInputs[category.id] || ""}
                  onChange={(e) =>
                    setNewItemInputs((prev) => ({
                      ...prev,
                      [category.id]: e.target.value,
                    }))
                  }
                  placeholder="Adicionar item..."
                  className="text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddItem(category.id);
                    }
                  }}
                />
                <Button size="sm" onClick={() => handleAddItem(category.id)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome da categoria</label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Hobbies do Avatar"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subtítulo (opcional)</label>
              <Input
                value={newCategorySubtitle}
                onChange={(e) => setNewCategorySubtitle(e.target.value)}
                placeholder="Ex: (Gatilho do Reconhecimento)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCategoryDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddCategory}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
