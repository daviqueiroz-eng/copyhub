import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useIdeasMelhorias } from "@/hooks/useIdeasMelhorias";
import { useUserRole } from "@/hooks/useAuth";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Upload, X, Lightbulb, Trash2, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function IdeasMelhorias() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { ideias, isLoading, createIdeia, deleteIdeia, uploadImagem } = useIdeasMelhorias();
  const { data: userRole } = useUserRole();
  const [nome, setNome] = useState("");
  const [feedback, setFeedback] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  // Redirecionar para auth se não estiver logado
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 5) {
      alert("Você pode enviar no máximo 5 imagens");
      return;
    }

    setSelectedImages([...selectedImages, ...files]);

    // Criar previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Upload das imagens
      const imageUrls = await Promise.all(
        selectedImages.map((file) => uploadImagem(file))
      );

      // Criar ideia
      await createIdeia.mutateAsync({
        nome,
        feedback,
        imagens: imageUrls,
      });

      // Limpar form
      setNome("");
      setFeedback("");
      setSelectedImages([]);
      setPreviews([]);
    } catch (error) {
      console.error("Erro ao enviar ideia:", error);
    } finally {
      setUploading(false);
    }
  };

  const isAdmin = userRole === "admin";

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-6">
          <Lightbulb className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Ideias de Melhorias</h1>
            <p className="text-muted-foreground">
              Compartilhe suas ideias e feedbacks para melhorarmos nossa plataforma
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Formulário de envio */}
          <Card>
            <CardHeader>
              <CardTitle>Enviar Nova Ideia</CardTitle>
              <CardDescription>
                Preencha o formulário abaixo com sua sugestão ou feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Qual o seu nome?</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback">
                    Qual ideia/feedback que gostaria de adicionar?
                  </Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={6}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Imagens (opcional - máximo 5)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                      id="image-upload"
                      disabled={selectedImages.length >= 5}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("image-upload")?.click()}
                      disabled={selectedImages.length >= 5}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Adicionar Imagens ({selectedImages.length}/5)
                    </Button>
                  </div>

                  {previews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mt-2">
                      {previews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-md border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button type="submit" disabled={uploading || createIdeia.isPending}>
                  {(uploading || createIdeia.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Enviar Ideia
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lista de ideias (apenas para admins) */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Ideias Recebidas</CardTitle>
                <CardDescription>
                  Visualize todas as ideias e feedbacks enviados pela equipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : ideias && ideias.length > 0 ? (
                  <div className="space-y-4">
                    {ideias.map((ideia) => (
                      <Card key={ideia.id} className="border-l-4 border-l-primary">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">{ideia.nome}</h3>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(ideia.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                                  locale: ptBR,
                                })}
                              </p>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Deletar ideia?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. A ideia será permanentemente removida.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteIdeia.mutate(ideia.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Deletar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>

                          <p className="text-foreground whitespace-pre-wrap mb-3">
                            {ideia.feedback}
                          </p>

                          {ideia.imagens && ideia.imagens.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                                <ImageIcon className="h-4 w-4" />
                                <span>{ideia.imagens.length} {ideia.imagens.length === 1 ? 'imagem' : 'imagens'}</span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {ideia.imagens.map((img, idx) => (
                                  <a
                                    key={idx}
                                    href={img}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                  >
                                    <img
                                      src={img}
                                      alt={`Imagem ${idx + 1}`}
                                      className="w-full h-32 object-cover rounded-md border hover:opacity-80 transition-opacity cursor-pointer"
                                    />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma ideia recebida ainda.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
