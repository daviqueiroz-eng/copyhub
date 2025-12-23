import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { FileText, Save, Trash2, ArrowLeft } from "lucide-react";

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

  const handleSelectQuantidade = (qtd: number) => {
    setQuantidade(qtd);
    setRoteiros(Array.from({ length: qtd }, () => ({ headline: "", estrutura: "" })));
    setShowQuantidadeDialog(false);
  };

  const handleUpdateRoteiro = (index: number, field: keyof RoteiroItem, value: string) => {
    setRoteiros(prev => {
      const newRoteiros = [...prev];
      newRoteiros[index] = { ...newRoteiros[index], [field]: value };
      return newRoteiros;
    });
  };

  const handleLimparRoteiro = (index: number) => {
    setRoteiros(prev => {
      const newRoteiros = [...prev];
      newRoteiros[index] = { headline: "", estrutura: "" };
      return newRoteiros;
    });
  };

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

    // Aqui você pode adicionar a lógica de salvar no banco de dados
    toast({
      title: "Roteiros salvos!",
      description: `${preenchidos.length} roteiro(s) foram salvos com sucesso.`,
    });
  };

  const handleReset = () => {
    setQuantidade(null);
    setRoteiros([]);
    setShowQuantidadeDialog(true);
  };

  const preenchidosCount = roteiros.filter(r => r.headline.trim() || r.estrutura.trim()).length;

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
      {quantidade && (
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                Reiniciar
              </Button>
              <Button onClick={handleSalvarTodos} className="gap-2">
                <Save className="w-4 h-4" />
                Salvar Todos ({preenchidosCount})
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-6 pr-4">
              {roteiros.map((roteiro, index) => (
                <Card key={index} className="p-5 border-2 border-border hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary font-poppins">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleLimparRoteiro(index)}
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
                        HEADLINE {String(index + 1).padStart(2, '0')}:
                      </label>
                      <Input
                        value={roteiro.headline}
                        onChange={(e) => handleUpdateRoteiro(index, "headline", e.target.value)}
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
                        ESTRUTURA {String(index + 1).padStart(2, '0')}:
                      </label>
                      <Textarea
                        value={roteiro.estrutura}
                        onChange={(e) => handleUpdateRoteiro(index, "estrutura", e.target.value)}
                        placeholder="Digite a estrutura do roteiro..."
                        className="font-poppins text-[14px] min-h-[100px] border-b-2 border-b-blue-500/50 rounded-b-none focus:border-b-blue-500 resize-none"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>

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
          </div>
        </Card>
      )}
    </div>
  );
}
