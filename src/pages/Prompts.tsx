import { useState } from "react";
import { Plus, PlayCircle, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePrompts, useDeletePrompt, type Prompt } from "@/hooks/usePrompts";
import { useUserRole } from "@/hooks/useAuth";
import { PromptViewDialog } from "@/components/PromptViewDialog";
import { PromptFormDialog } from "@/components/PromptFormDialog";
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

const Prompts = () => {
  const { data: prompts = [], isLoading } = usePrompts();
  const { data: userRole } = useUserRole();
  const deletePrompt = useDeletePrompt();

  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);

  const isAdmin = userRole === "admin";

  const handleViewPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setViewDialogOpen(true);
  };

  const handleEditPrompt = (e: React.MouseEvent, prompt: Prompt) => {
    e.stopPropagation();
    setEditingPrompt(prompt);
    setFormDialogOpen(true);
  };

  const handleDeletePrompt = (e: React.MouseEvent, promptId: string) => {
    e.stopPropagation();
    setPromptToDelete(promptId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (promptToDelete) {
      deletePrompt.mutate(promptToDelete, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setPromptToDelete(null);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Carregando prompts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Banco de Prompts</h2>
          <p className="text-muted-foreground mt-1">
            Galeria de prompts validados com vídeos explicativos
          </p>
        </div>
        {isAdmin && (
          <Button className="gap-2" onClick={() => {
            setEditingPrompt(null);
            setFormDialogOpen(true);
          }}>
            <Plus className="h-4 w-4" />
            Novo Prompt
          </Button>
        )}
      </div>

      {prompts.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Nenhum prompt cadastrado ainda.
            </p>
            {isAdmin && (
              <Button onClick={() => setFormDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Prompt
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prompts.map((prompt) => (
            <Card
              key={prompt.id}
              className="transition-all hover:shadow-lg group cursor-pointer"
              onClick={() => handleViewPrompt(prompt)}
            >
              <CardHeader>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
                  <PlayCircle className="h-12 w-12 text-primary group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  
                  {/* Botões de Admin */}
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={(e) => handleEditPrompt(e, prompt)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={(e) => handleDeletePrompt(e, prompt.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg">{prompt.titulo}</CardTitle>
                <CardDescription>{prompt.descricao}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Nicho:</span> {prompt.nicho}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Visualização */}
      <PromptViewDialog
        prompt={selectedPrompt}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />

      {/* Dialog de Criação/Edição */}
      <PromptFormDialog
        prompt={editingPrompt}
        open={formDialogOpen}
        onOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) setEditingPrompt(null);
        }}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este prompt? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Prompts;
