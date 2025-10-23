import { useState, useRef } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNichos, useCreateNicho } from "@/hooks/useNichos";
import { useToast } from "@/hooks/use-toast";

const Testes = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userResponse, setUserResponse] = useState("");
  const [novoNicho, setNovoNicho] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const { data: nichos = [], isLoading } = useNichos();
  const createNicho = useCreateNicho();
  const { toast } = useToast();

  const currentNicho = nichos[currentIndex];

  const handleNext = () => {
    if (currentIndex < nichos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserResponse("");
      setDragOffset(0);
    } else {
      toast({
        title: "Fim dos nichos!",
        description: "Você chegou ao último nicho.",
      });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setUserResponse("");
      setDragOffset(0);
    }
  };

  const handleCreateNicho = () => {
    if (!novoNicho.trim()) return;

    createNicho.mutate(novoNicho, {
      onSuccess: () => {
        setNovoNicho("");
        setIsDialogOpen(false);
      },
    });
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    setDragStartX(clientX);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const offset = clientX - dragStartX;
    setDragOffset(offset);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (Math.abs(dragOffset) > 100) {
      if (dragOffset > 0) {
        handlePrevious();
      } else {
        handleNext();
      }
    }
    setDragOffset(0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Carregando nichos...</p>
      </div>
    );
  }

  if (nichos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground">Nenhum nicho cadastrado ainda.</p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Primeiro Nicho
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Novo Nicho</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="nicho">Nome do Nicho</Label>
                <Input
                  id="nicho"
                  value={novoNicho}
                  onChange={(e) => setNovoNicho(e.target.value)}
                  placeholder="Ex: Mercado Financeiro"
                />
              </div>
              <Button onClick={handleCreateNicho} className="w-full">
                Registrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Teste de Conhecimento
        </h2>
        <p className="text-muted-foreground">
          Arraste para o lado ou use as setas para navegar
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {currentIndex + 1} de {nichos.length}
        </p>
      </div>

      <div className="relative w-full max-w-2xl mb-6">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="h-12 w-12"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <div
            ref={cardRef}
            className="flex-1 cursor-grab active:cursor-grabbing"
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
            style={{
              transform: `translateX(${dragOffset}px) rotate(${dragOffset / 20}deg)`,
              transition: isDragging ? "none" : "transform 0.3s ease-out",
            }}
          >
            <Card className="shadow-2xl border-2 hover:shadow-3xl transition-shadow">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="inline-block bg-primary/10 px-6 py-3 rounded-full mb-4">
                    <h3 className="text-2xl font-bold text-primary">
                      {currentNicho?.nome}
                    </h3>
                  </div>
                  <p className="text-muted-foreground">
                    Escreva uma ideia de conteúdo para este nicho
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resposta" className="text-lg">
                    Sua resposta:
                  </Label>
                  <Textarea
                    id="resposta"
                    value={userResponse}
                    onChange={(e) => setUserResponse(e.target.value)}
                    placeholder="Ex: 3 investimentos para fazer em 2025"
                    className="min-h-[150px] text-base resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={currentIndex === nichos.length - 1}
            className="h-12 w-12"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Registrar Novo Nicho
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Novo Nicho</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="nicho">Nome do Nicho</Label>
              <Input
                id="nicho"
                value={novoNicho}
                onChange={(e) => setNovoNicho(e.target.value)}
                placeholder="Ex: Mercado Financeiro"
              />
            </div>
            <Button onClick={handleCreateNicho} className="w-full">
              Registrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Testes;
