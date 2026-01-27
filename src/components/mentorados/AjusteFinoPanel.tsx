import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, Send, Loader2, Plus } from "lucide-react";
import { useTiposAjuste } from "@/hooks/useTiposAjuste";
import { TiposAjusteDialog } from "./TiposAjusteDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AjusteFinoPanelProps {
  headline: string;
  estrutura: string;
  selecao: { text: string; field: "headline" | "estrutura" } | null;
  onUpdate: (headline: string, estrutura: string) => void;
  onClearSelection: () => void;
}

export const AjusteFinoPanel = ({
  headline,
  estrutura,
  selecao,
  onUpdate,
  onClearSelection,
}: AjusteFinoPanelProps) => {
  const { data: tiposAjuste = [], isLoading: loadingTipos } = useTiposAjuste();
  const [instrucaoLivre, setInstrucaoLivre] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTiposDialog, setShowTiposDialog] = useState(false);

  // Ao clicar em um ajuste, colar as instruções no campo de texto
  const handleAjusteClick = (instrucoes: string | null | undefined) => {
    if (!instrucoes) return;
    setInstrucaoLivre((prev) => {
      if (prev.trim()) {
        return `${prev}\n\n${instrucoes}`;
      }
      return instrucoes;
    });
  };

  const handleEnviar = async () => {
    if (!instrucaoLivre.trim()) {
      toast({
        title: "Digite uma instrução",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const payload = {
        headline,
        estrutura,
        ajustes: [],
        instrucao_livre: instrucaoLivre.trim(),
        selecao: selecao
          ? {
              texto: selecao.text,
              campo: selecao.field,
            }
          : null,
      };

      const { data, error } = await supabase.functions.invoke("n8n-ajustes", {
        body: payload,
      });

      if (error) throw error;

      // O webhook pode retornar headline e estrutura atualizados
      if (data) {
        const newHeadline = data.headline || headline;
        const newEstrutura = data.estrutura || estrutura;
        
        if (newHeadline !== headline || newEstrutura !== estrutura) {
          onUpdate(newHeadline, newEstrutura);
          toast({ title: "Roteiro atualizado com sucesso!" });
        } else {
          toast({ title: "Ajuste processado" });
        }
      }

      // Limpar após sucesso
      setInstrucaoLivre("");
      onClearSelection();
    } catch (error) {
      console.error("Erro ao processar ajustes:", error);
      toast({
        title: "Erro ao processar ajustes",
        description: "Tente novamente em alguns segundos.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-2 bg-muted/50 border-b shrink-0 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Ajuste Fino</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setShowTiposDialog(true)}
        >
          <Settings className="h-3 w-3 mr-1" />
          Gerenciar
        </Button>
      </div>

      {/* Lista de ajustes (clicáveis) */}
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-2">
          {loadingTipos && (
            <div className="text-center py-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            </div>
          )}

          {tiposAjuste.map((tipo) => (
            <button
              key={tipo.id}
              type="button"
              onClick={() => handleAjusteClick(tipo.instrucoes)}
              className="w-full text-left p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <p className="font-medium text-sm">{tipo.nome}</p>
              {tipo.descricao && (
                <p className="text-xs text-muted-foreground truncate">
                  {tipo.descricao}
                </p>
              )}
            </button>
          ))}

          {!loadingTipos && tiposAjuste.length === 0 && (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">
                Nenhum tipo de ajuste cadastrado
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTiposDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar ajuste
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input de instrução */}
      <div className="border-t shrink-0">
        {/* Indicador de seleção */}
        {selecao && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/50 border-b text-xs">
            <span className="text-muted-foreground">Seleção:</span>
            <span className="font-medium text-accent-foreground truncate max-w-[200px]">
              "{selecao.text}"
            </span>
          </div>
        )}

        <div className="px-4 py-3">
          <div className="flex gap-2">
            <Textarea
              value={instrucaoLivre}
              onChange={(e) => setInstrucaoLivre(e.target.value)}
              placeholder="Clique em um ajuste acima ou digite sua instrução..."
              disabled={isProcessing}
              className="flex-1 min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleEnviar();
                }
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] text-muted-foreground">
              Ctrl+Enter para enviar
            </p>
            <Button
              size="sm"
              onClick={handleEnviar}
              disabled={isProcessing || !instrucaoLivre.trim()}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              Enviar
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog de gerenciamento */}
      <TiposAjusteDialog
        open={showTiposDialog}
        onOpenChange={setShowTiposDialog}
      />
    </div>
  );
};
