import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Instagram } from "lucide-react";
import { Mentorado } from "@/hooks/useMentorados";
import { useEffect, useRef } from "react";
import { Draggable } from "@fullcalendar/interaction";

const TiktokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

interface MentoradoCardProps {
  mentorado: Mentorado;
  onClick?: () => void;
  hasEntrega?: boolean;
}

export function MentoradoCard({ mentorado, onClick, hasEntrega }: MentoradoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    const draggable = new Draggable(cardRef.current, {
      eventData: {
        title: mentorado.nome,
        duration: { days: 1 },
        extendedProps: { mentoradoId: mentorado.id },
      },
    });
    return () => draggable.destroy();
  }, [mentorado.id, mentorado.nome]);

  const handleInstagramClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mentorado.instagram) {
      const handle = mentorado.instagram.replace(/^@/, "");
      window.open(`https://instagram.com/${handle}`, "_blank", "noopener,noreferrer");
    }
  };

  const handleTiktokClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mentorado.tiktok) {
      const handle = mentorado.tiktok.replace(/^@/, "");
      window.open(`https://tiktok.com/@${handle}`, "_blank", "noopener,noreferrer");
    }
  };

  const handleDragStart = () => {
    (window as any).__draggedMentoradoId = mentorado.id;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (e.button !== 0 || target?.closest("button")) return;

    const dragState = {
      id: mentorado.id,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      handled: false,
    };

    (window as any).__mentoradoCategoryDrag = dragState;
    (window as any).__draggedMentoradoId = mentorado.id;

    const handlePointerMove = (event: PointerEvent) => {
      if ((window as any).__mentoradoCategoryDrag !== dragState) return;

      const distance = Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY);
      if (distance > 8) {
        dragState.moved = true;
      }
    };

    const cleanup = () => {
      document.removeEventListener("pointermove", handlePointerMove, true);
      document.removeEventListener("pointerup", handlePointerUp, true);
      document.removeEventListener("pointercancel", handlePointerUp, true);
    };

    const handlePointerUp = () => {
      window.setTimeout(() => {
        if ((window as any).__mentoradoCategoryDrag === dragState && !dragState.handled) {
          (window as any).__mentoradoCategoryDrag = null;
          (window as any).__draggedMentoradoId = null;
        }
        cleanup();
      }, 0);
    };

    document.addEventListener("pointermove", handlePointerMove, true);
    document.addEventListener("pointerup", handlePointerUp, true);
    document.addEventListener("pointercancel", handlePointerUp, true);
  };

  return (
    <Card
      ref={cardRef}
      draggable
      onPointerDown={handlePointerDown}
      onDragStart={handleDragStart}
      className={`p-2 flex items-center gap-2 cursor-grab active:cursor-grabbing hover:bg-accent/50 transition-colors ${
        hasEntrega ? "border-green-500 border-2" : ""
      }`}
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
      {mentorado.tiktok && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={handleTiktokClick}
        >
          <TiktokIcon className="h-3 w-3" />
        </Button>
      )}
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
