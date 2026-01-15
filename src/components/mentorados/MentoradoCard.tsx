import { useDraggable } from "@dnd-kit/core";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Instagram } from "lucide-react";
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

  const handleInstagramClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mentorado.instagram) {
      const handle = mentorado.instagram.replace(/^@/, "");
      window.open(`https://instagram.com/${handle}`, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-2 flex items-center gap-2 cursor-grab active:cursor-grabbing hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={mentorado.avatar || undefined} alt={mentorado.nome} />
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
          {mentorado.iniciais}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{mentorado.nome}</p>
        {mentorado.plano && (
          <p className="text-xs text-muted-foreground truncate">{mentorado.plano}</p>
        )}
      </div>
      {mentorado.instagram && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={handleInstagramClick}
        >
          <Instagram className="h-3 w-3 text-pink-500" />
        </Button>
      )}
    </Card>
  );
}
