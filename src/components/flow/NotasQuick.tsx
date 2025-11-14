import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useFlowNotas,
  useCreateNota,
  useUpdateNota,
  useDeleteNota,
} from "@/hooks/useFlowNotas";

const CORES = ["#fbbf24", "#f87171", "#60a5fa", "#34d399", "#a78bfa"];

export const NotasQuick = () => {
  const { data: notas, isLoading } = useFlowNotas();
  const createNota = useCreateNota();
  const updateNota = useUpdateNota();
  const deleteNota = useDeleteNota();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notaEditando, setNotaEditando] = useState<any>(null);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [cor, setCor] = useState(CORES[0]);

  const handleSubmit = () => {
    if (!titulo.trim()) return;

    if (notaEditando) {
      updateNota.mutate({
        id: notaEditando.id,
        titulo,
        conteudo,
        cor,
      });
    } else {
      createNota.mutate({ titulo, conteudo, cor });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTitulo("");
    setConteudo("");
    setCor(CORES[0]);
    setNotaEditando(null);
  };

  const handleEdit = (nota: any) => {
    setNotaEditando(nota);
    setTitulo(nota.titulo);
    setConteudo(nota.conteudo || "");
    setCor(nota.cor);
    setIsDialogOpen(true);
  };

  if (isLoading) return <div>Carregando notas...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">📝 Notas Rápidas</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" /> Nova Nota
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {notaEditando ? "Editar Nota" : "Nova Nota"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Título da nota..."
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>
              <div>
                <Textarea
                  placeholder="Conteúdo..."
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cor</label>
                <div className="flex gap-2">
                  {CORES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCor(c)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        cor === c ? "border-foreground" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {notaEditando ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notas?.map((nota) => (
          <Card
            key={nota.id}
            className="p-4 relative"
            style={{ backgroundColor: nota.cor, borderColor: nota.cor }}
          >
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-800">{nota.titulo}</h4>
              {nota.conteudo && (
                <p className="text-sm text-gray-700 line-clamp-3">
                  {nota.conteudo}
                </p>
              )}
            </div>
            <div className="flex gap-1 mt-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEdit(nota)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteNota.mutate(nota.id)}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
