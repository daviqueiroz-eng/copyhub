import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAllHeadlineChecklistItems,
  useCreateChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
} from "@/hooks/useHeadlineChecklist";

interface HeadlineChecklistConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HeadlineChecklistConfig({ open, onOpenChange }: HeadlineChecklistConfigProps) {
  const { user } = useAuth();
  const { data: items = [] } = useAllHeadlineChecklistItems();
  const createItem = useCreateChecklistItem();
  const updateItem = useUpdateChecklistItem();
  const deleteItem = useDeleteChecklistItem();
  const [newLabel, setNewLabel] = useState("");

  const handleAdd = () => {
    if (!newLabel.trim() || !user) return;
    const maxOrdem = items.length > 0 ? Math.max(...items.map((i) => i.ordem)) + 1 : 0;
    createItem.mutate({ label: newLabel.trim(), ordem: maxOrdem, user_id: user.id });
    setNewLabel("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Checklist das Headlines</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 p-2 border rounded-md">
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                value={item.label}
                onChange={(e) =>
                  updateItem.mutate({ id: item.id, label: e.target.value })
                }
                className="h-8 text-sm flex-1"
              />
              <Switch
                checked={item.ativo}
                onCheckedChange={(checked) =>
                  updateItem.mutate({ id: item.id, ativo: checked })
                }
                className="scale-75"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => deleteItem.mutate(item.id)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Novo item do checklist..."
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button size="sm" onClick={handleAdd} className="gap-1">
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
