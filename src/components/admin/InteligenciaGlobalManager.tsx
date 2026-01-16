import { useState, useEffect } from "react";
import { Loader2, Save, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useInteligenciaGlobal, useUpdateInteligenciaGlobal } from "@/hooks/useInteligenciaGlobal";

export const InteligenciaGlobalManager = () => {
  const { data: inteligenciaGlobal, isLoading } = useInteligenciaGlobal();
  const updateInteligencia = useUpdateInteligenciaGlobal();
  
  const [titulo, setTitulo] = useState("Método Principal");
  const [conteudo, setConteudo] = useState("");

  useEffect(() => {
    if (inteligenciaGlobal) {
      setTitulo(inteligenciaGlobal.titulo);
      setConteudo(inteligenciaGlobal.conteudo);
    }
  }, [inteligenciaGlobal]);

  const handleSave = () => {
    if (!conteudo.trim()) return;
    updateInteligencia.mutate({ titulo: titulo.trim() || "Método Principal", conteudo: conteudo.trim() });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Inteligência Global para IA</CardTitle>
            <CardDescription>
              Configure o método, framework e regras de copywriting que serão usados pela IA para adaptar headlines.
              Estas informações são compartilhadas com todos os usuários.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="titulo-inteligencia">Título</Label>
          <Input
            id="titulo-inteligencia"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Método Principal, Framework de Headlines"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="conteudo-inteligencia">Conteúdo da Inteligência</Label>
          <Textarea
            id="conteudo-inteligencia"
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            placeholder={`Descreva aqui:
• O método de copywriting utilizado
• Regras para criação de headlines
• Estruturas que funcionam bem
• Gatilhos mentais preferidos
• Tom de voz padrão
• Exemplos de headlines de sucesso
• O que evitar nas adaptações`}
            className="min-h-[400px] font-mono text-sm"
          />
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={updateInteligencia.isPending || !conteudo.trim()}
          >
            {updateInteligencia.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Inteligência Global
          </Button>
        </div>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p className="font-medium mb-2">💡 Dica:</p>
          <p>
            Quanto mais detalhada for a inteligência global, melhores serão as adaptações de headlines.
            Inclua exemplos específicos, regras claras e o tom de voz que deve ser usado.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
