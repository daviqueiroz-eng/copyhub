import { useState } from "react";
import { useHeadlinesCriadas, useDeleteHeadlineCriada } from "@/hooks/useHeadlinesCriadas";
import { useNichos } from "@/hooks/useNichos";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Copy, Trash2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const HeadlinesCriadasView = () => {
  const { data: headlines = [], isLoading } = useHeadlinesCriadas();
  const { data: nichos = [] } = useNichos();
  const deleteHeadline = useDeleteHeadlineCriada();
  const { toast } = useToast();
  
  const [filtroNicho, setFiltroNicho] = useState<string>("all");

  const handleCopyHeadline = (headline: string) => {
    navigator.clipboard.writeText(headline);
    toast({
      title: "Copiado!",
      description: "Headline copiada para a área de transferência.",
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja remover esta headline?")) {
      deleteHeadline.mutate(id);
    }
  };

  // Filtrar headlines
  const filteredHeadlines = filtroNicho === "all" 
    ? headlines 
    : headlines.filter(h => h.nicho_id === filtroNicho);

  // Agrupar por nicho
  const headlinesPorNicho = filteredHeadlines.reduce((acc, headline) => {
    const nichoNome = headline.nicho?.nome || "Sem nicho";
    if (!acc[nichoNome]) {
      acc[nichoNome] = [];
    }
    acc[nichoNome].push(headline);
    return acc;
  }, {} as Record<string, typeof headlines>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Headlines Criadas
          </h2>
          <p className="text-sm text-muted-foreground">
            {headlines.length} headline{headlines.length !== 1 ? 's' : ''} criada{headlines.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Filtro por nicho */}
        <Select value={filtroNicho} onValueChange={setFiltroNicho}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por nicho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os nichos</SelectItem>
            {nichos.map((nicho) => (
              <SelectItem key={nicho.id} value={nicho.id}>
                {nicho.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de headlines */}
      {headlines.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma headline ainda</h3>
          <p className="text-sm text-muted-foreground">
            Suas headlines criadas durante as análises de roteiros aparecerão aqui.
          </p>
        </Card>
      ) : (
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {Object.entries(headlinesPorNicho).map(([nichoNome, headlinesNicho]) => (
              <div key={nichoNome}>
                {/* Header do nicho */}
                <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                  <span className="text-sm font-semibold text-primary">🎯 {nichoNome}</span>
                  <span className="text-xs text-muted-foreground">
                    ({headlinesNicho.length} headline{headlinesNicho.length !== 1 ? 's' : ''})
                  </span>
                </div>
                
                {/* Lista de headlines deste nicho */}
                <div className="space-y-3">
                  {headlinesNicho.map((headline) => (
                    <Card key={headline.id} className="p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Headline */}
                          <p className="text-sm font-medium mb-2">
                            "{headline.headline}"
                          </p>
                          
                          {/* Metadata */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {headline.roteiro && (
                              <span className="bg-muted px-2 py-0.5 rounded">
                                📄 {headline.roteiro.titulo}
                              </span>
                            )}
                            <span>
                              {format(new Date(headline.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </div>
                          
                          {/* Estrutura base se existir */}
                          {headline.estrutura_base && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              Estrutura base: {headline.estrutura_base.slice(0, 100)}{headline.estrutura_base.length > 100 ? '...' : ''}
                            </p>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleCopyHeadline(headline.headline)}
                            title="Copiar headline"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(headline.id)}
                            title="Remover headline"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
