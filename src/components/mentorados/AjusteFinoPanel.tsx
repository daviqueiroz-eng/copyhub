import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Send, Loader2, Plus } from "lucide-react";
import { useTiposAjuste, TipoAjuste } from "@/hooks/useTiposAjuste";
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
  const [selectedAjustes, setSelectedAjustes] = useState<Set<string>>(new Set());
  const [instrucaoLivre, setInstrucaoLivre] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTiposDialog, setShowTiposDialog] = useState(false);

  const toggleAjuste = (id: string) => {
    setSelectedAjustes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleEnviar = async () => {
    if (selectedAjustes.size === 0 && !instrucaoLivre.trim()) {
      toast({
        title: "Selecione ao menos um ajuste ou digite uma instrução",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Montar array de ajustes selecionados
      const ajustesSelecionados: { nome: string; instrucoes: string }[] = [];
      selectedAjustes.forEach((id) => {
        const tipo = tiposAjuste.find((t) => t.id === id);
        if (tipo) {
          ajustesSelecionados.push({
            nome: tipo.nome,
            instrucoes: tipo.instrucoes || tipo.descricao || "",
          });
        }
      });

      const payload = {
        headline,
        estrutura,
        ajustes: ajustesSelecionados,
        instrucao_livre: instrucaoLivre.trim() || null,
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

      // Limpar seleções após sucesso
      setSelectedAjustes(new Set());
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

      {/* Lista de ajustes */}
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-2">
          {loadingTipos && (
            <div className="text-center py-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            </div>
          )}

          {tiposAjuste.map((tipo) => (
            <label
              key={tipo.id}
              className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={selectedAjustes.has(tipo.id)}
                onCheckedChange={() => toggleAjuste(tipo.id)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{tipo.nome}</p>
                {tipo.descricao && (
                  <p className="text-xs text-muted-foreground truncate">
                    {tipo.descricao}
                  </p>
                )}
              </div>
            </label>
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

      {/* Input de instrução livre */}
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
            <Input
              value={instrucaoLivre}
              onChange={(e) => setInstrucaoLivre(e.target.value)}
              placeholder="Instrução adicional (opcional)..."
              disabled={isProcessing}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleEnviar();
                }
              }}
            />
            <Button
              size="icon"
              onClick={handleEnviar}
              disabled={
                isProcessing ||
                (selectedAjustes.size === 0 && !instrucaoLivre.trim())
              }
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {selectedAjustes.size > 0
              ? `${selectedAjustes.size} ajuste(s) selecionado(s)`
              : "Selecione ajustes acima ou digite uma instrução"}
          </p>
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
