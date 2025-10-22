import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const testes = [
  {
    id: 1,
    titulo: "Teste de Copywriting - Nível 1",
    aluno: "João Silva",
    data: "2025-10-20",
    status: "pendente",
  },
  {
    id: 2,
    titulo: "Teste de Headlines Avançadas",
    aluno: "Maria Santos",
    data: "2025-10-18",
    status: "corrigido",
    nota: 8.5,
  },
];

const Testes = () => {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Teste de Conhecimento</h2>
          <p className="text-muted-foreground mt-1">
            Avaliações e feedbacks dos mentorados
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Teste
        </Button>
      </div>

      <div className="space-y-4">
        {testes.map((teste) => (
          <Card key={teste.id} className="transition-all hover:shadow-lg cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">{teste.titulo}</CardTitle>
                  </div>
                  <CardDescription>
                    {teste.aluno} • {teste.data}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={teste.status === "corrigido" ? "default" : "secondary"}
                  >
                    {teste.status}
                  </Badge>
                  {teste.nota && (
                    <Badge variant="outline" className="font-semibold">
                      Nota: {teste.nota}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Testes;
