import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink } from "lucide-react";
import { ProgressoRoteiro } from "@/hooks/useProgressoRoteiros";
import { Roteiro } from "@/hooks/useRoteiros";
import { useCoresAnalise } from "@/hooks/useCoresAnalise";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RoteiroAnaliseViewProps {
  progresso: ProgressoRoteiro;
  roteiro: Roteiro;
}

interface Highlight {
  text: string;
  color: string;
  startPos: number;
  endPos: number;
}

export const RoteiroAnaliseView = ({ progresso, roteiro }: RoteiroAnaliseViewProps) => {
  const { data: cores } = useCoresAnalise();

  const renderHighlightedText = () => {
    if (!progresso.sublinhados || !Array.isArray(progresso.sublinhados) || progresso.sublinhados.length === 0) {
      return <div className="whitespace-pre-wrap">{roteiro.conteudo}</div>;
    }

    const highlights = progresso.sublinhados as Highlight[];
    const sortedHighlights = [...highlights].sort((a, b) => a.startPos - b.startPos);
    
    const elements: JSX.Element[] = [];
    let lastIndex = 0;

    sortedHighlights.forEach((highlight, idx) => {
      if (highlight.startPos > lastIndex) {
        elements.push(
          <span key={`text-${idx}`}>
            {roteiro.conteudo.substring(lastIndex, highlight.startPos)}
          </span>
        );
      }

      elements.push(
        <mark
          key={`highlight-${idx}`}
          style={{ backgroundColor: highlight.color }}
          className="rounded px-0.5"
        >
          {highlight.text}
        </mark>
      );

      lastIndex = highlight.endPos;
    });

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
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{roteiro.titulo}</h2>
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
      <div className="flex-1 grid grid-cols-[200px_1fr_1fr] gap-4 min-h-0">
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
