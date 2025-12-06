import { useState, useMemo } from "react";
import { Upload, Filter, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrelloUploadDialog } from "./TrelloUploadDialog";
import { PrioridadeCard } from "./PrioridadeCard";
import {
  useTrelloImport,
  extractUniqueCopywriters,
  filterAndSortCards,
  TrelloCard,
} from "@/hooks/useTrelloImport";
import { useUserRole } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function OrdemPrioridadeView() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedCopywriter, setSelectedCopywriter] = useState<string>("");
  
  const { data: trelloImport, isLoading } = useTrelloImport();
  const { data: userRole } = useUserRole();
  const isAdmin = userRole === "admin";

  const cards = useMemo(() => {
    if (!trelloImport?.dados) return [];
    return trelloImport.dados as unknown as TrelloCard[];
  }, [trelloImport]);

  const copywriters = useMemo(() => {
    return extractUniqueCopywriters(cards);
  }, [cards]);

  const filteredCards = useMemo(() => {
    return filterAndSortCards(cards, selectedCopywriter);
  }, [cards, selectedCopywriter]);

  const lastUpdate = trelloImport?.created_at
    ? format(new Date(trelloImport.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Select value={selectedCopywriter} onValueChange={setSelectedCopywriter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filtrar por copywriter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os copywriters</SelectItem>
                {copywriters.map((cw) => (
                  <SelectItem key={cw} value={cw}>
                    {cw}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isAdmin && (
          <Button onClick={() => setIsUploadOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Importar CSV
          </Button>
        )}
      </div>

      {/* Info do último import */}
      {lastUpdate && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>
            Arquivo: <strong>{trelloImport?.nome_arquivo}</strong> • Importado em {lastUpdate}
          </span>
        </div>
      )}

      {/* Contador */}
      {selectedCopywriter && selectedCopywriter !== "all" && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-primary" />
              <span className="font-medium">
                Você tem <Badge variant="secondary" className="mx-1">{filteredCards.length}</Badge> 
                {filteredCards.length === 1 ? " entrega pendente" : " entregas pendentes"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de cards ou estado vazio */}
      {!trelloImport ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Upload className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum arquivo importado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isAdmin 
                ? "Faça upload de um arquivo CSV do Trello para começar"
                : "Aguarde o administrador importar os dados do Trello"
              }
            </p>
            {isAdmin && (
              <Button onClick={() => setIsUploadOpen(true)} variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Importar CSV
              </Button>
            )}
          </CardContent>
        </Card>
      ) : filteredCards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma entrega encontrada</h3>
            <p className="text-sm text-muted-foreground">
              {selectedCopywriter && selectedCopywriter !== "all"
                ? "Não há entregas pendentes para este copywriter com prazo definido"
                : "Selecione um copywriter para ver suas entregas"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCards.map((card, index) => (
            <PrioridadeCard key={`${card.cardName}-${index}`} card={card} />
          ))}
        </div>
      )}

      {/* Dialog de upload */}
      <TrelloUploadDialog open={isUploadOpen} onOpenChange={setIsUploadOpen} />
    </div>
  );
}
