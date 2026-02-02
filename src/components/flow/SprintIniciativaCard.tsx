import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SprintIniciativa, useSprintsTarefas } from "@/hooks/useSprints";

interface SprintIniciativaCardProps {
  iniciativa: SprintIniciativa;
  onClick: () => void;
}

const impactoBadgeVariant = {
  baixo: "secondary",
  medio: "default",
  alto: "destructive",
} as const;

const impactoLabel = {
  baixo: "Baixo",
  medio: "Médio",
  alto: "Alto",
};

export const SprintIniciativaCard = ({
  iniciativa,
  onClick,
}: SprintIniciativaCardProps) => {
  const { data: tarefas = [] } = useSprintsTarefas(iniciativa.id);

  const tarefasConcluidas = tarefas.filter((t) => t.concluida).length;
  const totalTarefas = tarefas.length;
  const progresso = totalTarefas > 0 ? (tarefasConcluidas / totalTarefas) * 100 : 0;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: iniciativa.id,
    data: { type: "iniciativa", iniciativa },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm line-clamp-2">{iniciativa.titulo}</h4>
          <Badge variant={impactoBadgeVariant[iniciativa.impacto]}>
            {impactoLabel[iniciativa.impacto]}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {iniciativa.dono && (
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarImage src={iniciativa.dono.avatar || undefined} />
                <AvatarFallback className="text-[10px]">
                  {iniciativa.dono.nome?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[80px]">{iniciativa.dono.nome}</span>
            </div>
          )}

          {iniciativa.prazo_entrega && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {format(new Date(iniciativa.prazo_entrega), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </span>
            </div>
          )}
        </div>

        {totalTarefas > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progresso</span>
              <span>{Math.round(progresso)}%</span>
            </div>
            <Progress value={progresso} className="h-1.5" />
          </div>
        )}
      </div>
    </Card>
  );
};
