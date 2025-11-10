import { useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Mentorado } from "@/hooks/useMentorados";
import { GripVertical } from "lucide-react";

const getLevaVariant = (numeroLeva: number): "destructive" | "default" | "secondary" => {
  if (numeroLeva === 1) return "destructive";
  if (numeroLeva === 2 || numeroLeva === 3) return "default";
  return "secondary";
};

const getLevaBorderColor = (numeroLeva: number): string => {
  if (numeroLeva === 1) return "border-l-4 border-l-red-500";
  if (numeroLeva === 2 || numeroLeva === 3) return "border-l-4 border-l-yellow-500";
  return "border-l-4 border-l-blue-500";
};

interface DraggableEntregaCardProps {
  entregaId: string;
  mentorado: Mentorado;
  numeroLeva: number;
}

export function DraggableEntregaCard({ 
  entregaId, 
  mentorado, 
  numeroLeva 
}: DraggableEntregaCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cardEl = cardRef.current;
    if (!cardEl) return;

    // Tornar o elemento draggable para FullCalendar
    cardEl.setAttribute("data-entrega-id", entregaId);
    cardEl.setAttribute("draggable", "true");

    const handleDragStart = (e: DragEvent) => {
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", entregaId);
        
        // Adicionar dados para o FullCalendar
        e.dataTransfer.setData("entregaId", entregaId);
      }
      
      cardEl.style.opacity = "0.5";
    };

    const handleDragEnd = () => {
      cardEl.style.opacity = "1";
    };

    cardEl.addEventListener("dragstart", handleDragStart);
    cardEl.addEventListener("dragend", handleDragEnd);

    return () => {
      cardEl.removeEventListener("dragstart", handleDragStart);
      cardEl.removeEventListener("dragend", handleDragEnd);
    };
  }, [entregaId]);

  const borderColor = getLevaBorderColor(numeroLeva);
  const badgeVariant = getLevaVariant(numeroLeva);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            ref={cardRef}
            className={`p-3 cursor-grab active:cursor-grabbing hover:bg-accent hover:shadow-md transition-all duration-200 ${borderColor}`}
          >
            <div className="flex items-center gap-3">
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={mentorado.avatar || undefined} alt={mentorado.nome} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {mentorado.iniciais}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{mentorado.nome}</p>
                <Badge variant={badgeVariant} className="mt-1 text-xs">
                  Leva {numeroLeva}
                </Badge>
              </div>
            </div>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{mentorado.nome}</p>
            <p className="text-xs text-muted-foreground">
              Leva {numeroLeva} - Arraste para o calendário para definir a data limite
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
