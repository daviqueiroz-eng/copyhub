import { useDraggable } from "@dnd-kit/core";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Mentorado } from "@/hooks/useMentorados";

interface MentoradoCardProps {
  mentorado: Mentorado;
  onClick?: () => void;
}

export function MentoradoCard({ mentorado, onClick }: MentoradoCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: mentorado.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={mentorado.avatar || undefined} alt={mentorado.nome} />
        <AvatarFallback className="bg-primary text-primary-foreground">
          {mentorado.iniciais}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{mentorado.nome}</p>
        {mentorado.plano && (
          <p className="text-xs text-muted-foreground truncate">{mentorado.plano}</p>
        )}
      </div>
    </Card>
  );
}
