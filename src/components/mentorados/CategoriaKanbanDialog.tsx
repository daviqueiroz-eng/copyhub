import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Mentorado, useUpdateMentorado } from "@/hooks/useMentorados";

const CATEGORIAS = ["Pausado", "Churn", "Acompanhar", "Finalizado"] as const;
type Categoria = (typeof CATEGORIAS)[number];

const CATEGORIA_COLORS: Record<Categoria, string> = {
  Pausado: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
  Churn: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
  Acompanhar: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  Finalizado: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentorados: Mentorado[];
}

export function CategoriaKanbanDialog({ open, onOpenChange, mentorados }: Props) {
  const updateMentorado = useUpdateMentorado();

  const columns = useMemo(() => {
    const map: Record<Categoria, Mentorado[]> = {
      Pausado: [],
      Churn: [],
      Acompanhar: [],
      Finalizado: [],
    };
    mentorados.forEach((m) => {
      const cat = (m as any).categoria as Categoria | null;
      if (cat && cat in map) {
        map[cat].push(m);
      }
    });
    return map;
  }, [mentorados]);

  const handleRemoveCategoria = (mentorado: Mentorado) => {
    updateMentorado.mutate({ id: mentorado.id, categoria: null } as any);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Categorias dos Mentorados</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-4 overflow-y-auto max-h-[60vh] py-2">
          {CATEGORIAS.map((cat) => (
            <div key={cat} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Badge variant="outline" className={CATEGORIA_COLORS[cat]}>
                  {cat}
                </Badge>
                <span className="text-xs text-muted-foreground">({columns[cat].length})</span>
              </div>

              <div className="space-y-2 min-h-[100px]">
                {columns[cat].map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={m.avatar || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                        {m.iniciais}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate flex-1">{m.nome}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={() => handleRemoveCategoria(m)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {columns[cat].length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhum mentorado</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
