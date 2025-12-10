import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Image, Loader2 } from "lucide-react";
import {
  useFotosCelebracao,
  useCreateFotoCelebracao,
  useDeleteFotoCelebracao,
} from "@/hooks/useFotosCelebracao";
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

interface GerenciarFotosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GerenciarFotosDialog({
  open,
  onOpenChange,
}: GerenciarFotosDialogProps) {
  const { data: fotos, isLoading } = useFotosCelebracao();
  const createFoto = useCreateFotoCelebracao();
  const deleteFoto = useDeleteFotoCelebracao();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fotoParaDeletar, setFotoParaDeletar] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await createFoto.mutateAsync(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    if (fotoParaDeletar) {
      const foto = fotos?.find((f) => f.id === fotoParaDeletar);
      if (foto) {
        await deleteFoto.mutateAsync(foto);
      }
      setFotoParaDeletar(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Gerenciar Fotos de Celebração
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="foto-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={createFoto.isPending}
              >
                {createFoto.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Adicionar Foto
              </Button>
              <span className="text-sm text-muted-foreground">
                {fotos?.length || 0} foto(s) cadastrada(s)
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : fotos?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma foto cadastrada ainda.</p>
                <p className="text-sm">
                  Adicione fotos para aparecerem quando usuários completarem
                  análises.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {fotos?.map((foto) => (
                  <div
                    key={foto.id}
                    className="relative group rounded-lg overflow-hidden border"
                  >
                    <img
                      src={foto.url}
                      alt="Foto de celebração"
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setFotoParaDeletar(foto.id)}
                        disabled={deleteFoto.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!fotoParaDeletar}
        onOpenChange={() => setFotoParaDeletar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover foto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A foto será removida
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
