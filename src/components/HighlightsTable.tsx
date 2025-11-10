import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

type Highlight = {
  id: string;
  text: string;
  color: string;
  startPos: number;
  endPos: number;
  annotation?: string;
  annotations?: string[];
};

interface HighlightsTableProps {
  highlights: Highlight[];
  colorName: string;
  color: string;
  onRemoveHighlight: (highlightId: string) => void;
}

export const HighlightsTable = ({
  highlights,
  colorName,
  color,
  onRemoveHighlight,
}: HighlightsTableProps) => {
  return (
    <div className="space-y-4">
      {/* Cabeçalho informativo */}
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
        <div
          className="w-4 h-4 rounded-full border"
          style={{ backgroundColor: color }}
        />
        <span className="font-semibold">{colorName}</span>
        <span className="text-sm text-muted-foreground">
          ({highlights.length} {highlights.length === 1 ? 'palavra' : 'palavras'} grifada{highlights.length === 1 ? '' : 's'})
        </span>
      </div>

      {/* Tabela */}
      {highlights.length > 0 ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">#</TableHead>
                <TableHead>Palavra/Frase Grifada</TableHead>
                <TableHead>Comentário</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {highlights.map((highlight, index) => (
                <TableRow key={highlight.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <span 
                      className="px-2 py-1 rounded"
                      style={{ backgroundColor: color }}
                    >
                      {highlight.text}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {highlight.annotation || highlight.annotations?.join(", ") || '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveHighlight(highlight.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          Nenhuma palavra grifada com esta cor
        </p>
      )}
    </div>
  );
};
