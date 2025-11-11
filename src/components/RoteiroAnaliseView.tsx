import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLink, Trash2 } from "lucide-react";
import { ProgressoRoteiro, useDeleteProgressoRoteiro } from "@/hooks/useProgressoRoteiros";
import { Roteiro } from "@/hooks/useRoteiros";
import { useCoresAnalise } from "@/hooks/useCoresAnalise";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface RoteiroAnaliseViewProps {
  progresso: ProgressoRoteiro;
  roteiro: Roteiro;
  onDelete?: () => void;
}

interface Highlight {
  id?: string;
  text: string;
  color: string;
  startPos: number;
  endPos: number;
  annotation?: string;
  annotations?: string[];
  commentPositions?: Record<number, { x: number; y: number }>;
}

export const RoteiroAnaliseView = ({ progresso, roteiro, onDelete }: RoteiroAnaliseViewProps) => {
  const { data: cores } = useCoresAnalise();
  const deleteProgressoRoteiro = useDeleteProgressoRoteiro();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const handleDeleteAnalysis = async () => {
    await deleteProgressoRoteiro.mutateAsync(progresso.id);
    setShowDeleteAlert(false);
    if (onDelete) onDelete();
  };

  const renderHighlightedText = () => {
    if (!progresso.sublinhados || !Array.isArray(progresso.sublinhados) || progresso.sublinhados.length === 0) {
      return <div className="whitespace-pre-wrap">{roteiro.conteudo}</div>;
    }

    const highlights = progresso.sublinhados as Highlight[];
    const sortedHighlights = [...highlights].sort((a, b) => a.startPos - b.startPos);
    
    const elements: JSX.Element[] = [];
    let lastIndex = 0;

    sortedHighlights.forEach((highlight, idx) => {
      // Texto antes do highlight
      if (highlight.startPos > lastIndex) {
        elements.push(
          <span key={`text-${idx}`}>
            {roteiro.conteudo.substring(lastIndex, highlight.startPos)}
          </span>
        );
      }

      // Pegar comentários
      const comments = highlight.annotations && highlight.annotations.length > 0
        ? highlight.annotations
        : highlight.annotation
        ? [highlight.annotation]
        : [];

      // Highlight com comentários
      elements.push(
        <span key={`wrapper-${idx}`} className="relative inline-block">
          <mark
            style={{ 
              backgroundColor: highlight.color,
              color: '#fff',
              padding: '2px 4px',
              borderRadius: '3px',
              fontWeight: 500
            }}
          >
            {highlight.text}
          </mark>

          {/* Renderizar comentários com posicionamento igual à análise */}
          {comments.length > 0 && (
            <div className="relative">
              {comments.map((comment, i) => {
                const customPos = highlight.commentPositions?.[i];
                const hasCustomPos = customPos !== undefined;
                
                const positionStyle = hasCustomPos
                  ? {
                      position: 'absolute' as const,
                      left: customPos.x,
                      top: customPos.y,
                      zIndex: 50,
                    }
                  : {};
                
                const positionClasses = !hasCustomPos
                  ? 'absolute z-10 left-full ml-2 top-0'
                  : '';
                
                return (
                  <div
                    key={`comment-${idx}-${i}`}
                    className={positionClasses}
                    style={{
                      ...positionStyle,
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: highlight.color,
                        color: '#000',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }}
                      className="inline-block text-xs select-none max-w-[300px] whitespace-normal break-words"
                    >
                      💬 {comment}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </span>
      );

      lastIndex = highlight.endPos;
    });

    // Texto final
    if (lastIndex < roteiro.conteudo.length) {
      elements.push(
        <span key="text-end">
          {roteiro.conteudo.substring(lastIndex)}
        </span>
      );
    }

    return <div className="whitespace-pre-wrap">{elements}</div>;
  };

  return (
    <div className="flex flex-col gap-4 min-h-[600px]">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{roteiro.titulo}</h2>
          <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar Análise
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja deletar esta análise? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAnalysis}>
                  Deletar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            Completado em: {progresso.data_completado ? format(new Date(progresso.data_completado), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "N/A"}
          </span>
          {roteiro.link_video && (
            <Button variant="link" size="sm" asChild className="p-0 h-auto">
              <a href={roteiro.link_video} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                Ver vídeo
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-[200px_1fr_1fr] gap-4 h-[calc(100vh-300px)] max-h-[800px]">
        {/* Left Column - Color Legend */}
        <Card className="p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold mb-3">Legenda de Cores</h3>
          <div className="space-y-2">
            {cores?.map((cor) => (
              <div key={cor.id} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border border-border shrink-0"
                  style={{ backgroundColor: cor.cor }}
                />
                <span className="text-xs">{cor.nome}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Center Column - Roteiro with Highlights */}
        <Card className="p-6 overflow-y-auto">
          <div className="prose prose-sm max-w-none">
            {renderHighlightedText()}
          </div>
        </Card>

        {/* Right Column - Analysis Fields */}
        <Card className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Retire a estrutura invisível
            </label>
            <Textarea
              value={progresso.estrutura_invisivel || ""}
              disabled
              className="min-h-[120px] resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Quais os 7 gatilhos da atenção
            </label>
            <Textarea
              value={progresso.gatilhos_atencao || ""}
              disabled
              className="min-h-[120px] resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Estrutura do roteiro
            </label>
            <Textarea
              value={progresso.estrutura_roteiro || ""}
              disabled
              className="min-h-[120px] resize-none"
            />
          </div>
        </Card>
      </div>
    </div>
  );
};
