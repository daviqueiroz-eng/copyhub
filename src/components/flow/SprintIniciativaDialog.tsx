import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useCreateIniciativa, useProfiles } from "@/hooks/useSprints";
import { toast } from "sonner";

interface SprintIniciativaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SprintIniciativaDialog = ({
  open,
  onOpenChange,
}: SprintIniciativaDialogProps) => {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [criterio, setCriterio] = useState("");
  const [donoId, setDonoId] = useState<string>("");
  const [impacto, setImpacto] = useState<"baixo" | "medio" | "alto">("medio");
  const [prazo, setPrazo] = useState<Date | undefined>();

  const { data: profiles = [] } = useProfiles();
  const createIniciativa = useCreateIniciativa();

  const resetForm = () => {
    setTitulo("");
    setDescricao("");
    setCriterio("");
    setDonoId("");
    setImpacto("medio");
    setPrazo(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim()) {
      toast.error("O título é obrigatório");
      return;
    }

    if (!donoId) {
      toast.error("Selecione um dono para a iniciativa");
      return;
    }

    try {
      await createIniciativa.mutateAsync({
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        criterio_conclusao: criterio.trim() || undefined,
        dono_id: donoId,
        impacto,
        prazo_entrega: prazo ? format(prazo, "yyyy-MM-dd") : undefined,
      });

      toast.success("Iniciativa criada com sucesso!");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao criar iniciativa");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar Nova Iniciativa</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Nome da iniciativa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva a iniciativa brevemente"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="criterio">Critério de Conclusão</Label>
            <Textarea
              id="criterio"
              value={criterio}
              onChange={(e) => setCriterio(e.target.value)}
              placeholder="Como saber que a iniciativa foi concluída?"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dono *</Label>
              <Select value={donoId} onValueChange={setDonoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.user_id} value={profile.user_id}>
                      {profile.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Impacto</Label>
              <Select
                value={impacto}
                onValueChange={(v) => setImpacto(v as typeof impacto)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Prazo de Entrega</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !prazo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {prazo
                    ? format(prazo, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={prazo}
                  onSelect={setPrazo}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createIniciativa.isPending}>
              {createIniciativa.isPending ? "Criando..." : "Criar Iniciativa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
