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

const headlines = [
  {
    id: 1,
    headline: "Como [RESULTADO] em [TEMPO] sem [OBJEÇÃO]",
    categoria: "Transformação",
    nicho: "Geral",
    taxa: "8.2%",
  },
  {
    id: 2,
    headline: "O método [ADJETIVO] para [RESULTADO DESEJADO]",
    categoria: "Método",
    nicho: "Infoprodutos",
    taxa: "7.5%",
  },
];

const Headlines = () => {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Modelos Validados de Headline</h2>
          <p className="text-muted-foreground mt-1">
            Biblioteca de headlines com performance comprovada
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Headline
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar headline..."
          className="pl-9"
        />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Headline</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Nicho</TableHead>
              <TableHead>Taxa de Conversão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {headlines.map((headline) => (
              <TableRow key={headline.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">{headline.headline}</TableCell>
                <TableCell>
                  <Badge variant="outline">{headline.categoria}</Badge>
                </TableCell>
                <TableCell>{headline.nicho}</TableCell>
                <TableCell className="text-primary font-semibold">{headline.taxa}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Headlines;
