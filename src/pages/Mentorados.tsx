import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const mentorados = [
  {
    id: 1,
    nome: "João Silva",
    plano: "Plano Pro",
    nicho: "Saúde e Bem-estar",
    iniciais: "JS",
  },
  {
    id: 2,
    nome: "Maria Santos",
    plano: "Plano Premium",
    nicho: "E-commerce",
    iniciais: "MS",
  },
];

const Mentorados = () => {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Meus Mentorados</h2>
          <p className="text-muted-foreground mt-1">
            Repositório de perfis e diagnósticos
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Mentorado
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar mentorado..."
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mentorados.map((mentorado) => (
          <Card key={mentorado.id} className="transition-all hover:shadow-lg cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {mentorado.iniciais}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{mentorado.nome}</CardTitle>
                  <CardDescription>{mentorado.plano}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Nicho:</span> {mentorado.nicho}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Mentorados;
