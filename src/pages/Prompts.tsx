import { Plus, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const prompts = [
  {
    id: 1,
    titulo: "Prompt de Headlines Emocionais",
    descricao: "Geração de headlines com gatilhos emocionais validados",
    nicho: "Geral",
  },
  {
    id: 2,
    titulo: "Prompt de Copy para Stories",
    descricao: "Estrutura completa para stories de vendas",
    nicho: "Instagram",
  },
];

const Prompts = () => {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Banco de Prompts</h2>
          <p className="text-muted-foreground mt-1">
            Galeria de prompts validados com vídeos explicativos
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Prompt
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prompts.map((prompt) => (
          <Card key={prompt.id} className="transition-all hover:shadow-lg group cursor-pointer">
            <CardHeader>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
                <PlayCircle className="h-12 w-12 text-primary group-hover:scale-110 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              <CardTitle className="text-lg">{prompt.titulo}</CardTitle>
              <CardDescription>{prompt.descricao}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Nicho:</span> {prompt.nicho}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Prompts;
