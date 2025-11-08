import { useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mentorado } from "@/hooks/useMentorados";
import { GripVertical } from "lucide-react";

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

  return (
    <Card
      ref={cardRef}
      className="p-3 cursor-grab active:cursor-grabbing hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <Avatar className="h-8 w-8">
          <AvatarImage src={mentorado.avatar || undefined} alt={mentorado.nome} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {mentorado.iniciais}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{mentorado.nome}</p>
          <Badge variant="outline" className="mt-1 text-xs">
            Leva {numeroLeva}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
