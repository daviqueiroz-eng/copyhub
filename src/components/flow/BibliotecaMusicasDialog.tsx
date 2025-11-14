import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Music, Trash2 } from "lucide-react";
import { useFlowBiblioteca } from "@/hooks/useFlowBiblioteca";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

export const BibliotecaMusicasDialog = () => {
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  
  const { musicas, isLoading, createMusica, deleteMusica } = useFlowBiblioteca();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !youtubeUrl.trim()) return;

    createMusica.mutate(
      { titulo, youtube_url: youtubeUrl },
      {
        onSuccess: () => {
          setTitulo("");
          setYoutubeUrl("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Music className="mr-2 h-4 w-4" />
          Gerenciar Biblioteca
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Biblioteca de Músicas/Vídeos</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              placeholder="Ex: Lofi Hip Hop - Study Music"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="url">URL do YouTube</Label>
            <Input
              id="url"
              placeholder="https://youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={createMusica.isPending}>
            {createMusica.isPending ? "Adicionando..." : "Adicionar à Biblioteca"}
          </Button>
        </form>

        <div className="mt-6">
          <h4 className="font-semibold mb-3">Músicas cadastradas ({musicas.length})</h4>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : musicas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma música cadastrada ainda.
                </p>
              ) : (
                musicas.map((musica) => (
                  <Card key={musica.id} className="p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{musica.titulo}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-md">
                        {musica.youtube_url}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMusica.mutate(musica.id)}
                      disabled={deleteMusica.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
