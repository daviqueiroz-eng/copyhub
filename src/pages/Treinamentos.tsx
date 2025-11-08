import { useState } from "react";
import { Plus, PlayCircle, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTreinamentos, useDeleteTreinamento, Treinamento } from "@/hooks/useTreinamentos";
import { useModulos } from "@/hooks/useModulos";
import { useAulas } from "@/hooks/useAulas";
import { useProgressoAulas } from "@/hooks/useProgressoAulas";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useAuth";
import TreinamentoFormDialog from "@/components/TreinamentoFormDialog";
import TreinamentoDetailView from "@/components/TreinamentoDetailView";

const TreinamentoCard = ({ 
  treinamento, 
  onView, 
  onEdit, 
  onDelete, 
  isAdmin,
  progressoGeral,
  totalModulos 
}: {
  treinamento: Treinamento;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isAdmin: boolean;
  progressoGeral: number;
  totalModulos: number;
}) => {
  return (
    <Card className="transition-all hover:shadow-lg group cursor-pointer" onClick={onView}>
      <CardHeader>
        <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
          {treinamento.thumbnail_url ? (
            <img
              src={treinamento.thumbnail_url}
              alt={treinamento.titulo}
              className="w-full h-full object-cover"
            />
          ) : (
            <PlayCircle className="h-16 w-16 text-primary group-hover:scale-110 transition-transform" />
          )}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
          
          {isAdmin && (
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="destructive"
                className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-xl">{treinamento.titulo}</CardTitle>
            <Badge variant="secondary">{totalModulos} módulos</Badge>
          </div>
          <CardDescription className="line-clamp-2">{treinamento.descricao}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-semibold">{Math.round(progressoGeral)}%</span>
            </div>
            <Progress value={progressoGeral} className="h-2" />
          </div>
          <Button size="sm" variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); onView(); }}>
            Acessar Treinamento
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const Treinamentos = () => {
  const { user } = useAuth();
  const { data: role } = useUserRole();
  const isAdmin = role === "admin";

  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedTreinamento, setSelectedTreinamento] = useState<Treinamento | null>(null);
  const [treinamentoDialogOpen, setTreinamentoDialogOpen] = useState(false);
  const [editTreinamento, setEditTreinamento] = useState<Treinamento | undefined>();
  const [deleteTreinamentoId, setDeleteTreinamentoId] = useState<string | null>(null);

  const { data: treinamentos = [], isLoading } = useTreinamentos();
  const { data: progresso = [] } = useProgressoAulas(user?.id);
  const deleteTreinamentoMutation = useDeleteTreinamento();

  const handleViewTreinamento = (treinamento: Treinamento) => {
    setSelectedTreinamento(treinamento);
    setViewMode("detail");
  };

  const handleEditTreinamento = (treinamento: Treinamento) => {
    setEditTreinamento(treinamento);
    setTreinamentoDialogOpen(true);
  };

  const handleDeleteTreinamento = async () => {
    if (deleteTreinamentoId) {
      await deleteTreinamentoMutation.mutateAsync(deleteTreinamentoId);
      setDeleteTreinamentoId(null);
    }
  };

  const handleBack = () => {
    setViewMode("list");
    setSelectedTreinamento(null);
  };

  if (viewMode === "detail" && selectedTreinamento) {
    return <TreinamentoDetailView treinamento={selectedTreinamento} onBack={handleBack} />;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Treinamentos</h2>
          <p className="text-muted-foreground mt-1">
            Biblioteca de aulas e materiais de aprendizado
          </p>
        </div>
        {isAdmin && (
          <Button 
            className="gap-2" 
            onClick={() => {
              setEditTreinamento(undefined);
              setTreinamentoDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Novo Treinamento
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="aspect-video w-full mb-4" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : treinamentos.length === 0 ? (
        <div className="text-center py-12">
          <PlayCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum treinamento ainda</h3>
          <p className="text-muted-foreground mb-4">
            {isAdmin ? "Crie seu primeiro treinamento para começar!" : "Os treinamentos aparecerão aqui em breve."}
          </p>
          {isAdmin && (
            <Button onClick={() => { setEditTreinamento(undefined); setTreinamentoDialogOpen(true); }}>
              <Plus className="h-4 w-4" />
              Criar Primeiro Treinamento
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {treinamentos.map((treinamento) => {
            // Hook calls para calcular progresso
            const TreinamentoWithProgress = () => {
              const { data: modulos = [] } = useModulos(treinamento.id);
              
              // Buscar todas as aulas de todos os módulos
              const allAulas = modulos.flatMap(modulo => {
                const { data: aulas = [] } = useAulas(modulo.id);
                return aulas;
              });

              const totalAulas = allAulas.length;
              const aulasConcluidas = progresso.filter(p => 
                allAulas.some(a => a.id === p.aula_id) && p.concluido
              ).length;
              const progressoGeral = totalAulas > 0 ? (aulasConcluidas / totalAulas) * 100 : 0;

              return (
                <TreinamentoCard
                  treinamento={treinamento}
                  onView={() => handleViewTreinamento(treinamento)}
                  onEdit={() => handleEditTreinamento(treinamento)}
                  onDelete={() => setDeleteTreinamentoId(treinamento.id)}
                  isAdmin={isAdmin}
                  progressoGeral={progressoGeral}
                  totalModulos={modulos.length}
                />
              );
            };

            return <TreinamentoWithProgress key={treinamento.id} />;
          })}
        </div>
      )}

      <TreinamentoFormDialog
        open={treinamentoDialogOpen}
        onOpenChange={setTreinamentoDialogOpen}
        treinamento={editTreinamento}
      />

      <AlertDialog open={!!deleteTreinamentoId} onOpenChange={() => setDeleteTreinamentoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Treinamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Isso deletará todos os módulos e aulas associados a este treinamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTreinamento}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Treinamentos;
