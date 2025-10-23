import { useState, useRef, useEffect, useMemo } from "react";
import { Plus, ChevronLeft, ChevronRight, Settings, Pencil, Trash2, Clock, Trophy } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNichos, useCreateNicho, useUpdateNicho, useDeleteNicho } from "@/hooks/useNichos";
import { useToast } from "@/hooks/use-toast";

const Testes = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userResponse, setUserResponse] = useState("");
  const [novoNicho, setNovoNicho] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNome, setEditingNome] = useState("");
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [timeLimit, setTimeLimit] = useState(120); // 2 minutes in seconds
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [sessionIdeas, setSessionIdeas] = useState(0);
  const [record, setRecord] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const { data: nichos = [], isLoading } = useNichos();
  const createNicho = useCreateNicho();
  const updateNicho = useUpdateNicho();
  const deleteNicho = useDeleteNicho();
  const { toast } = useToast();

  // Embaralha os nichos aleatoriamente
  const shuffledNichos = useMemo(() => {
    const shuffled = [...nichos];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [nichos]);

  const currentNicho = shuffledNichos[currentIndex];

  // Load record from localStorage
  useEffect(() => {
    const savedRecord = localStorage.getItem("nichos_record");
    if (savedRecord) {
      setRecord(parseInt(savedRecord));
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (!isTimerActive) return;

    if (timeRemaining <= 0) {
      setIsTimerActive(false);
      setIsResultOpen(true);
      if (sessionIdeas > record) {
        setRecord(sessionIdeas);
        localStorage.setItem("nichos_record", sessionIdeas.toString());
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive, timeRemaining, sessionIdeas, record]);

  // Start timer on first interaction
  useEffect(() => {
    if (userResponse.trim() && !isTimerActive && timeRemaining === timeLimit) {
      setIsTimerActive(true);
    }
  }, [userResponse, isTimerActive, timeRemaining, timeLimit]);

  const countIdeas = (text: string): number => {
    const lines = text.split("\n").filter((line) => line.trim().length > 0);
    return lines.length;
  };

  const ideasCount = countIdeas(userResponse);
  const canProceed = ideasCount >= 3;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleNext = () => {
    if (!canProceed) {
      toast({
        title: "Mínimo de 3 ideias!",
        description: "Você precisa ter pelo menos 3 ideias para avançar.",
        variant: "destructive",
      });
      return;
    }

    if (currentIndex < shuffledNichos.length - 1) {
      setSessionIdeas((prev) => prev + ideasCount);
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

  const handleRestart = () => {
    setTimeRemaining(timeLimit);
    setIsTimerActive(false);
    setSessionIdeas(0);
    setCurrentIndex(0);
    setUserResponse("");
    setIsResultOpen(false);
  };

  const handleConfigTime = () => {
    setTimeRemaining(timeLimit);
    setIsTimerActive(false);
    setIsConfigOpen(false);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setUserResponse("");
      setDragOffset(0);
    }
  };

  const handleEditNicho = (id: string, nome: string) => {
    setEditingId(id);
    setEditingNome(nome);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editingNome.trim()) return;

    updateNicho.mutate(
      { id: editingId, nome: editingNome },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditingNome("");
        },
      }
    );
  };

  const handleDeleteNicho = (id: string) => {
    deleteNicho.mutate(id);
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

  if (shuffledNichos.length === 0) {
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
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-primary">
              {formatTime(timeRemaining)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-muted-foreground">
              Recorde: {record} ideias
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {currentIndex + 1} de {shuffledNichos.length} | {ideasCount} ideias (mín. 3)
        </p>
      </div>

      <div className="absolute top-8 right-8 flex gap-2">
        <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Clock className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurar Tempo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="time">Tempo (minutos)</Label>
                <Input
                  id="time"
                  type="number"
                  min="1"
                  max="10"
                  value={timeLimit / 60}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value) * 60)}
                />
              </div>
              <Button onClick={handleConfigTime} className="w-full">
                Aplicar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Gerenciar Nichos</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Nicho</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nichos.map((nicho) => (
                    <TableRow key={nicho.id}>
                      <TableCell>
                        {editingId === nicho.id ? (
                          <Input
                            value={editingNome}
                            onChange={(e) => setEditingNome(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit();
                              if (e.key === "Escape") {
                                setEditingId(null);
                                setEditingNome("");
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <span>{nicho.nome}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditNicho(nicho.id, nicho.nome)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteNicho(nicho.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
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
                    placeholder="Ex: 3 investimentos para fazer em 2025&#10;Cada linha é uma ideia"
                    className="min-h-[150px] text-base resize-none"
                    disabled={!isTimerActive && timeRemaining !== timeLimit}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={currentIndex === shuffledNichos.length - 1 || !canProceed}
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

      <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Tempo Esgotado!</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4 text-center">
            <div className="space-y-2">
              <p className="text-muted-foreground">Você trouxe:</p>
              <p className="text-4xl font-bold text-primary">{sessionIdeas} ideias</p>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground">Seu recorde:</p>
              <div className="flex items-center justify-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <p className="text-3xl font-bold text-yellow-500">{record} ideias</p>
              </div>
            </div>
            <Button onClick={handleRestart} className="w-full">
              Começar Novamente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Testes;
