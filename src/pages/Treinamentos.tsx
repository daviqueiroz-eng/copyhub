import { Plus, PlayCircle, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const treinamentos = [
  {
    id: 1,
    titulo: "Fundamentos de Copywriting",
    modulo: "Módulo 1",
    duracao: "2h 30min",
    materiais: 3,
  },
  {
    id: 2,
    titulo: "Headlines que Vendem",
    modulo: "Módulo 2",
    duracao: "1h 45min",
    materiais: 2,
  },
];

const Treinamentos = () => {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Treinamentos</h2>
          <p className="text-muted-foreground mt-1">
            Biblioteca de aulas e materiais de aprendizado
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Treinamento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {treinamentos.map((treinamento) => (
          <Card key={treinamento.id} className="transition-all hover:shadow-lg group">
            <CardHeader>
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
                <PlayCircle className="h-16 w-16 text-primary group-hover:scale-110 transition-transform" />
                <Badge className="absolute top-3 left-3">{treinamento.modulo}</Badge>
              </div>
              <CardTitle className="text-xl">{treinamento.titulo}</CardTitle>
              <CardDescription>Duração: {treinamento.duracao}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileDown className="h-4 w-4" />
                  <span>{treinamento.materiais} materiais disponíveis</span>
                </div>
                <Button size="sm" variant="outline">
                  Acessar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Treinamentos;
