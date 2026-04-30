import { useState, useMemo } from "react";
import { Pencil, ExternalLink, Lock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Viral, formatoLabel } from "@/hooks/useVirais";
import { useAuth } from "@/contexts/AuthContext";
import { ViralEditDialog } from "./ViralEditDialog";

interface Props {
  virais: Viral[];
  loading?: boolean;
}

const formatViews = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return String(n);
};

const formatDate = (d: string): string => {
  try {
    return new Date(d).toLocaleDateString("pt-BR");
  } catch {
    return "";
  }
};

const PAGE_SIZE = 20;

export const ViraisTable = ({ virais, loading }: Props) => {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Viral | null>(null);

  const totalPages = Math.max(1, Math.ceil(virais.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => virais.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [virais, page]
  );

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Carregando virais...
      </div>
    );
  }

  if (virais.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg">
        Nenhum viral encontrado.
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[280px]">Headline</TableHead>
              <TableHead>Estrutura</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((v) => {
              const isOwner = v.user_id === user?.id;
              return (
                <TableRow key={v.id}>
                  <TableCell className="font-medium max-w-[400px]">
                    <span className="line-clamp-2">{v.headline}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {v.estrutura || formatoLabel(v.formato)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatViews(v.views)}
                  </TableCell>
                  <TableCell>
                    <a
                      href={v.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 text-sm max-w-[180px] truncate"
                    >
                      <span className="truncate">{v.link.replace(/^https?:\/\//, "")}</span>
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  </TableCell>
                  <TableCell className="text-sm">
                    {isOwner ? (
                      <span className="font-medium">Você</span>
                    ) : (
                      v.autor_nome
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(v.created_at)}
                  </TableCell>
                  <TableCell>
                    {isOwner ? (
                      <button
                        onClick={() => setEditing(v)}
                        className="p-1 hover:bg-accent rounded"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-sm">
          <span className="text-muted-foreground">
            Mostrando {(page - 1) * PAGE_SIZE + 1} a{" "}
            {Math.min(page * PAGE_SIZE, virais.length)} de {virais.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span className="text-xs">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}

      <ViralEditDialog viral={editing} onClose={() => setEditing(null)} />
    </>
  );
};