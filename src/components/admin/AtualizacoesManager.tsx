import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Rocket, Wrench, Lightbulb, Megaphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useAtualizacoes,
  useCreateAtualizacao,
  useDeleteAtualizacao,
  useToggleAtualizacao,
} from "@/hooks/useAtualizacoes";

const tipoOptions = [
  { value: "feature", label: "Nova Funcionalidade", icon: Rocket },
  { value: "fix", label: "Correção", icon: Wrench },
  { value: "improvement", label: "Melhoria", icon: Lightbulb },
];

export function AtualizacoesManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [versao, setVersao] = useState("");
  const [tipo, setTipo] = useState("feature");

  const { toast } = useToast();
  const { data: atualizacoes, isLoading } = useAtualizacoes();
  const createMutation = useCreateAtualizacao();
  const deleteMutation = useDeleteAtualizacao();
  const toggleMutation = useToggleAtualizacao();

  const handleCreate = async () => {
    if (!titulo.trim() || !conteudo.trim()) {
      toast({
        title: "Erro",
        description: "Título e conteúdo são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      await createMutation.mutateAsync({
        titulo: titulo.trim(),
        conteudo: conteudo.trim(),
        versao: versao.trim() || undefined,
        tipo,
      });

      toast({ title: "Sucesso", description: "Atualização criada!" });
      setDialogOpen(false);
      setTitulo("");
      setConteudo("");
      setVersao("");
      setTipo("feature");
    } catch {
      toast({
        title: "Erro",
        description: "Falha ao criar atualização",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Sucesso", description: "Atualização removida!" });
    } catch {
      toast({
        title: "Erro",
        description: "Falha ao remover",
        variant: "destructive",
      });
    }
  };

  const handleToggle = async (id: string, ativo: boolean) => {
    try {
      await toggleMutation.mutateAsync({ id, ativo });
    } catch {
      toast({
        title: "Erro",
        description: "Falha ao alterar status",
        variant: "destructive",
      });
    }
  };

  const getTipoIcon = (tipoValue: string) => {
    const opt = tipoOptions.find((o) => o.value === tipoValue);
    const Icon = opt?.icon || Megaphone;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Gerenciar Atualizações
        </CardTitle>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nova
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Atualização</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Nova funcionalidade de calendário"
                />
              </div>

              <div className="space-y-2">
                <Label>Conteúdo *</Label>
                <Textarea
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  placeholder="Descreva a atualização..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tipoOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.icon className="h-4 w-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Versão (opcional)</Label>
                  <Input
                    value={versao}
                    onChange={(e) => setVersao(e.target.value)}
                    placeholder="Ex: v1.2.0"
                  />
                </div>
              </div>

              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="w-full"
              >
                Criar Atualização
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Carregando...</p>
        ) : !atualizacoes || atualizacoes.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhuma atualização cadastrada
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Versão</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atualizacoes.map((atl) => (
                <TableRow key={atl.id}>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      {getTipoIcon(atl.tipo)}
                      {tipoOptions.find((o) => o.value === atl.tipo)?.label || atl.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {atl.titulo}
                  </TableCell>
                  <TableCell>{atl.versao || "-"}</TableCell>
                  <TableCell>
                    {new Date(atl.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={atl.ativo}
                      onCheckedChange={(checked) => handleToggle(atl.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(atl.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
