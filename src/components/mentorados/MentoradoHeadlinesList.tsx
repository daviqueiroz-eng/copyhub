import { useHeadlinesByMentorado, useDeleteHeadlineCriada } from "@/hooks/useHeadlinesCriadas";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Lightbulb } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MentoradoHeadlinesListProps {
  mentoradoId: string;
}

export const MentoradoHeadlinesList = ({ mentoradoId }: MentoradoHeadlinesListProps) => {
  const { data: headlines = [] } = useHeadlinesByMentorado(mentoradoId);
  const deleteHeadline = useDeleteHeadlineCriada();

  // Se não houver headlines, não renderizar nada
  if (headlines.length === 0) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Headline copiada!" });
  };

  const handleDelete = (id: string) => {
    deleteHeadline.mutate(id);
  };

  return (
    <div className="mt-4 pt-3 border-t">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="h-4 w-4 text-yellow-500" />
        <h4 className="text-sm font-semibold">Ideias de Headlines ({headlines.length})</h4>
      </div>
      
      <ScrollArea className="max-h-[200px]">
        <div className="space-y-2">
          {headlines.map((headline) => (
            <div 
              key={headline.id} 
              className="p-2 bg-muted/50 rounded-md text-sm group relative"
            >
              <p className="pr-12 leading-snug">{headline.headline}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(headline.created_at!), "dd MMM, HH:mm", { locale: ptBR })}
              </p>
              
              {/* Botões de ação (aparecem no hover) */}
              <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleCopy(headline.headline)}
                  title="Copiar"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => handleDelete(headline.id)}
                  title="Excluir"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
