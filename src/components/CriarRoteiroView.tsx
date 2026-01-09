import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { FileText, Save, Trash2, ArrowLeft, ChevronLeft, ChevronRight, Undo2, Redo2 } from "lucide-react";

type RoteiroItem = {
  headline: string;
  estrutura: string;
};

interface CriarRoteiroViewProps {
  onBack?: () => void;
}

export function CriarRoteiroView({ onBack }: CriarRoteiroViewProps) {
  const { toast } = useToast();
  const [showQuantidadeDialog, setShowQuantidadeDialog] = useState(true);
  const [quantidade, setQuantidade] = useState<number | null>(null);
  const [roteiros, setRoteiros] = useState<RoteiroItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Sistema de histórico para undo/redo
  const [history, setHistory] = useState<RoteiroItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleSelectQuantidade = (qtd: number) => {
    const initialRoteiros = Array.from({ length: qtd }, () => ({ headline: "", estrutura: "" }));
    setQuantidade(qtd);
    setRoteiros(initialRoteiros);
    setCurrentIndex(0);
    // Inicializar histórico com estado inicial
    setHistory([initialRoteiros.map(r => ({ ...r }))]);
    setHistoryIndex(0);
    setShowQuantidadeDialog(false);
  };

  // Salvar estado no histórico com debounce
  const saveToHistory = useCallback((newRoteiros: RoteiroItem[]) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(newRoteiros.map(r => ({ ...r })));
        // Limitar histórico a 50 entradas
        if (newHistory.length > 50) {
          newHistory.shift();
          return newHistory;
        }
        return newHistory;
      });
      setHistoryIndex(prev => Math.min(prev + 1, 49));
    }, 500);
  }, [historyIndex]);

  const handleUpdateRoteiro = (index: number, field: keyof RoteiroItem, value: string) => {
    setRoteiros(prev => {
      const newRoteiros = [...prev];
      newRoteiros[index] = { ...newRoteiros[index], [field]: value };
      
      if (!isUndoRedoRef.current) {
        saveToHistory(newRoteiros);
      }
      isUndoRedoRef.current = false;
      
      return newRoteiros;
    });
  };

  const handleLimparRoteiro = (index: number) => {
    setRoteiros(prev => {
      const newRoteiros = [...prev];
      newRoteiros[index] = { headline: "", estrutura: "" };
      
      if (!isUndoRedoRef.current) {
        saveToHistory(newRoteiros);
      }
      
      return newRoteiros;
    });
  };

  // Funções de Undo e Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setRoteiros(history[newIndex].map(r => ({ ...r })));
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setRoteiros(history[newIndex].map(r => ({ ...r })));
    }
  }, [historyIndex, history]);

  const handleSalvarTodos = () => {
    const preenchidos = roteiros.filter(r => r.headline.trim() || r.estrutura.trim());
    if (preenchidos.length === 0) {
      toast({
        title: "Nenhum roteiro preenchido",
        description: "Preencha pelo menos um roteiro para salvar.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Roteiros salvos!",
      description: `${preenchidos.length} roteiro(s) foram salvos com sucesso.`,
    });
  };

  const handleReset = () => {
    setQuantidade(null);
    setRoteiros([]);
    setCurrentIndex(0);
    setHistory([]);
    setHistoryIndex(-1);
    setShowQuantidadeDialog(true);
  };

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < roteiros.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, roteiros.length]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Navegação
      if (e.ctrlKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      }
      if (e.ctrlKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
      
      // Undo: Ctrl+Z
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
      
      // Redo: Ctrl+Shift+Z ou Ctrl+Y
      if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevious, handleNext, handleUndo, handleRedo]);

  const preenchidosCount = roteiros.filter(r => r.headline.trim() || r.estrutura.trim()).length;
  const currentRoteiro = roteiros[currentIndex];

  return (
    <div className="w-full">
      {/* Dialog para escolher quantidade */}
      <Dialog open={showQuantidadeDialog} onOpenChange={setShowQuantidadeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-poppins">
              Quantos roteiros você vai criar?
            </DialogTitle>
            <DialogDescription className="text-center">
              Escolha a quantidade de roteiros que deseja criar nesta sessão
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            {[15, 25, 30].map((qtd) => (
              <Button
                key={qtd}
                size="lg"
                className="h-16 text-xl font-poppins font-semibold"
                onClick={() => handleSelectQuantidade(qtd)}
              >
                {qtd} Roteiros
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Conteúdo principal */}
      {quantidade && currentRoteiro && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {onBack && (
                <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
              )}
              <div>
                <h2 className="text-2xl font-bold font-poppins">Criar {quantidade} Roteiros</h2>
                <p className="text-muted-foreground text-sm">
                  {preenchidosCount} de {quantidade} preenchidos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Botões Undo/Redo */}
              <div className="flex items-center gap-1 mr-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="h-8 w-8"
                  title="Desfazer (Ctrl+Z)"
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="h-8 w-8"
                  title="Refazer (Ctrl+Shift+Z)"
                >
                  <Redo2 className="w-4 h-4" />
                </Button>
              </div>
              
              <Button variant="outline" onClick={handleReset}>
                Reiniciar
              </Button>
              <Button onClick={handleSalvarTodos} className="gap-2">
                <Save className="w-4 h-4" />
                Salvar Todos ({preenchidosCount})
              </Button>
            </div>
          </div>

          {/* Navegação entre roteiros */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="h-10 w-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-2 min-w-[100px] justify-center">
              <span className="text-lg font-bold font-poppins">
                {String(currentIndex + 1).padStart(2, '0')}
              </span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">
                {String(quantidade).padStart(2, '0')}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={currentIndex === roteiros.length - 1}
              className="h-10 w-10"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Roteiro atual */}
          <Card className="p-5 border-2 border-primary/30">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-base font-bold text-primary font-poppins">
                    {String(currentIndex + 1).padStart(2, '0')}
                  </span>
                </div>
                <FileText className="w-5 h-5 text-muted-foreground" />
                {(currentRoteiro.headline.trim() || currentRoteiro.estrutura.trim()) && (
                  <span className="text-xs bg-green-500/20 text-green-600 px-2 py-0.5 rounded-full">
                    Preenchido
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => handleLimparRoteiro(currentIndex)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Headline */}
              <div>
                <label 
                  className="block text-sm font-bold mb-2 font-poppins"
                  style={{ color: '#B8860B' }}
                >
                  HEADLINE {String(currentIndex + 1).padStart(2, '0')}:
                </label>
                <Input
                  value={currentRoteiro.headline}
                  onChange={(e) => handleUpdateRoteiro(currentIndex, "headline", e.target.value)}
                  placeholder="Digite a headline do roteiro..."
                  className="font-poppins text-[16px] border-b-2 border-b-blue-500/50 rounded-b-none focus:border-b-blue-500"
                />
              </div>

              {/* Estrutura */}
              <div>
                <label 
                  className="block text-sm font-bold mb-2 font-poppins"
                  style={{ color: '#B8860B' }}
                >
                  ESTRUTURA {String(currentIndex + 1).padStart(2, '0')}:
                </label>
                <Textarea
                  value={currentRoteiro.estrutura}
                  onChange={(e) => handleUpdateRoteiro(currentIndex, "estrutura", e.target.value)}
                  placeholder="Digite a estrutura do roteiro..."
                  className="font-poppins text-[14px] min-h-[200px] border-b-2 border-b-blue-500/50 rounded-b-none focus:border-b-blue-500 resize-none"
                />
              </div>
            </div>
          </Card>

          {/* Indicadores de progresso (dots) */}
          <div className="flex items-center justify-center gap-1 mt-4 flex-wrap max-w-full">
            {roteiros.map((r, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-3 h-3 rounded-full transition-all ${
                  idx === currentIndex 
                    ? 'bg-primary scale-125' 
                    : (r.headline.trim() || r.estrutura.trim())
                      ? 'bg-green-500/60 hover:bg-green-500'
                      : 'bg-muted hover:bg-muted-foreground/30'
                }`}
                title={`Roteiro ${idx + 1}`}
              />
            ))}
          </div>

          {/* Barra de progresso fixa */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Progresso</span>
              <span>{preenchidosCount}/{quantidade}</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(preenchidosCount / quantidade) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Dica: Ctrl+Z desfazer | Ctrl+Shift+Z refazer | Ctrl+← / → navegar
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}