import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const intensificadores = [
  {
    id: 1,
    palavra: "Revolucionário",
    tipo: "Novidade",
    contexto: "Produtos inovadores",
    exemplo: "Método revolucionário que muda sua vida",
  },
  {
    id: 2,
    palavra: "Exclusivo",
    tipo: "Escassez",
    contexto: "Ofertas limitadas",
    exemplo: "Acesso exclusivo para os primeiros 100",
  },
];

const Intensificadores = () => {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Base de Intensificadores</h2>
          <p className="text-muted-foreground mt-1">
            Dicionário de palavras e expressões de impacto
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Intensificador
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar intensificador..."
          className="pl-9"
        />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Palavra/Expressão</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Contexto de Uso</TableHead>
              <TableHead>Exemplo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {intensificadores.map((item) => (
              <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-semibold text-primary">{item.palavra}</TableCell>
                <TableCell>
                  <Badge>{item.tipo}</Badge>
                </TableCell>
                <TableCell>{item.contexto}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.exemplo}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Intensificadores;
