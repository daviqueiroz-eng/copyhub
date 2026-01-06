import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: "headlines", label: "Selecionar headlines", checked: false },
  { id: "roteiros", label: "Escrever roteiros", checked: false },
  { id: "revisar", label: "Revisar", checked: false },
  { id: "docs", label: "Adicionar no docs", checked: false },
  { id: "avisar", label: "Avisar mentor no trello e no google chat", checked: false },
  { id: "datas", label: "Atualizar datas", checked: false },
];

interface RoteiroChecklistProps {
  mentoradoId: string;
  guiaNumero: number;
}

export const RoteiroChecklist = ({ mentoradoId, guiaNumero }: RoteiroChecklistProps) => {
  const storageKey = `roteiro-checklist-${mentoradoId}-${guiaNumero}`;
  
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_ITEMS);

  // Recarregar quando mudar de guia
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        setItems(DEFAULT_ITEMS.map(i => ({ ...i, checked: false })));
      }
    } else {
      setItems(DEFAULT_ITEMS.map(i => ({ ...i, checked: false })));
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const handleToggle = (id: string) => {
    setItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const completedCount = items.filter(i => i.checked).length;

  return (
    <div className="w-64 shrink-0 sticky top-8">
      <div className="bg-background border rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Checklist</h3>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{items.length}
          </span>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-2">
              <Checkbox
                id={item.id}
                checked={item.checked}
                onCheckedChange={() => handleToggle(item.id)}
                className="mt-0.5"
              />
              <Label
                htmlFor={item.id}
                className={`text-sm cursor-pointer leading-tight ${
                  item.checked ? "line-through text-muted-foreground" : ""
                }`}
              >
                {item.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
