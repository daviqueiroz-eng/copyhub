import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const comunicados = [
  {
    id: 1,
    titulo: "Bem-vindo à Central da Equipe!",
    conteudo: "Este é o espaço onde compartilhamos comunicados importantes, alinhamentos e atualizações para toda a equipe.",
    data: "2025-10-22",
    tipo: "importante",
  },
  {
    id: 2,
    titulo: "Novos materiais disponíveis",
    conteudo: "Atualizamos o banco de prompts com novos modelos validados. Confira na seção específica!",
    data: "2025-10-21",
    tipo: "atualização",
  },
];

const Mural = () => {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Mural</h2>
          <p className="text-muted-foreground mt-1">
            Central de comunicados e alinhamentos da equipe
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Comunicado
        </Button>
      </div>

      <div className="space-y-4">
        {comunicados.map((comunicado) => (
          <Card key={comunicado.id} className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{comunicado.titulo}</CardTitle>
                  <CardDescription>{comunicado.data}</CardDescription>
                </div>
                <Badge
                  variant={comunicado.tipo === "importante" ? "default" : "secondary"}
                >
                  {comunicado.tipo}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">{comunicado.conteudo}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Mural;
