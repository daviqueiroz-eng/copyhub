import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart3, User, Users, Clock, AlertTriangle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole, useProfile } from "@/hooks/useAuth";
import { useRoteiroFeedbacks, useAllRoteiroFeedbacks, RoteiroFeedback } from "@/hooks/useRoteiroFeedback";
import { useMentorados } from "@/hooks/useMentorados";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface ProfileData {
  nome: string;
  user_id: string;
}

// Hook para buscar todos os profiles (para admin)
const useAllProfiles = () => {
  return useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome");
      
      if (error) throw error;
      return data as ProfileData[];
    },
  });
};

const Acompanhamento = () => {
  const { user } = useAuth();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: myFeedbacks, isLoading: myFeedbacksLoading } = useRoteiroFeedbacks();
  const { data: allFeedbacks, isLoading: allFeedbacksLoading } = useAllRoteiroFeedbacks();
  const { data: mentorados } = useMentorados();
  const { data: allProfiles } = useAllProfiles();

  // Estados de filtro
  const [filterUser, setFilterUser] = useState<string | null>(null);
  const [filterMentorado, setFilterMentorado] = useState<string | null>(null);

  const isAdmin = role === "admin";

  // Criar mapa de mentorados para buscar nomes
  const mentoradosMap = mentorados?.reduce((acc, m) => {
    acc[m.id] = m.nome;
    return acc;
  }, {} as Record<string, string>) || {};

  // Criar mapa de profiles para buscar nomes de usuários
  const profilesMap = allProfiles?.reduce((acc, p) => {
    acc[p.user_id] = p.nome;
    return acc;
  }, {} as Record<string, string>) || {};

  const isLoading = roleLoading || profileLoading || myFeedbacksLoading;

  // Calcular estatísticas
  const calcStats = (feedbacks: RoteiroFeedback[]) => {
    if (!feedbacks || feedbacks.length === 0) {
      return { totalFeedbacks: 0, avgTotal: 0, avgHeadlines: 0, avgRoteiros: 0, avgRevisao: 0 };
    }

    const totals = feedbacks.map(f => 
      (f.tempo_headlines || 0) + (f.tempo_roteiros || 0) + (f.tempo_revisao || 0)
    );
    
    return {
      totalFeedbacks: feedbacks.length,
      avgTotal: Math.round(totals.reduce((a, b) => a + b, 0) / feedbacks.length),
      avgHeadlines: Math.round(feedbacks.reduce((a, f) => a + (f.tempo_headlines || 0), 0) / feedbacks.length),
      avgRoteiros: Math.round(feedbacks.reduce((a, f) => a + (f.tempo_roteiros || 0), 0) / feedbacks.length),
      avgRevisao: Math.round(feedbacks.reduce((a, f) => a + (f.tempo_revisao || 0), 0) / feedbacks.length),
    };
  };

  const myStats = calcStats(myFeedbacks || []);
  
  // Filtrar feedbacks para admin - HOOKS DEVEM VIR ANTES DO EARLY RETURN
  const filteredFeedbacks = useMemo(() => {
    let result = allFeedbacks || [];
    
    if (filterUser) {
      result = result.filter(f => f.user_id === filterUser);
    }
    if (filterMentorado) {
      result = result.filter(f => f.mentorado_id === filterMentorado);
    }
    
    return result;
  }, [allFeedbacks, filterUser, filterMentorado]);
  
  // Recalcular stats baseado nos feedbacks filtrados
  const filteredStats = useMemo(() => calcStats(filteredFeedbacks), [filteredFeedbacks]);

  const renderFeedbackTable = (feedbacks: RoteiroFeedback[], showUser: boolean = false) => {
    if (!feedbacks || feedbacks.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum feedback registrado ainda.</p>
          <p className="text-sm mt-2">
            Complete um checklist de roteiros para registrar seu primeiro feedback.
          </p>
        </div>
      );
    }

    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              {showUser && <TableHead>Usuário</TableHead>}
              <TableHead>Mentorado</TableHead>
              <TableHead>Guia</TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Headlines
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Roteiros
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Revisão
                </div>
              </TableHead>
              <TableHead className="text-center">Total</TableHead>
              <TableHead>Dificuldades</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedbacks.map((feedback) => {
              const total = (feedback.tempo_headlines || 0) + 
                           (feedback.tempo_roteiros || 0) + 
                           (feedback.tempo_revisao || 0);
              
              return (
                <TableRow key={feedback.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(feedback.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  {showUser && (
                    <TableCell>
                      <span className="font-medium">
                        {profilesMap[feedback.user_id] || "Desconhecido"}
                      </span>
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    {mentoradosMap[feedback.mentorado_id] || "Mentorado removido"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Guia {feedback.guia_numero}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {feedback.tempo_headlines > 0 ? `${feedback.tempo_headlines} min` : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {feedback.tempo_roteiros > 0 ? `${feedback.tempo_roteiros} min` : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {feedback.tempo_revisao > 0 ? `${feedback.tempo_revisao} min` : "-"}
                  </TableCell>
                  <TableCell className="text-center font-semibold text-primary">
                    {total > 0 ? `${total} min` : "-"}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {feedback.dificuldades ? (
                      <div className="flex items-start gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                        <span className="text-sm line-clamp-2">{feedback.dificuldades}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Acompanhamento</h1>
          <p className="text-muted-foreground">
            Acompanhe o tempo gasto e dificuldades nos roteiros
          </p>
        </div>
      </div>

      {isAdmin ? (
        <Tabs defaultValue="meus" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="meus" className="gap-2">
              <User className="h-4 w-4" />
              Meus Feedbacks
            </TabsTrigger>
            <TabsTrigger value="todos" className="gap-2">
              <Users className="h-4 w-4" />
              Todos os Feedbacks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="meus" className="space-y-4 mt-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Registros</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{myStats.totalFeedbacks}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Média Headlines</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{myStats.avgHeadlines} min</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Média Roteiros</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{myStats.avgRoteiros} min</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Média Total</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{myStats.avgTotal} min</p>
                </CardContent>
              </Card>
            </div>

            {renderFeedbackTable(myFeedbacks || [], false)}
          </TabsContent>

          <TabsContent value="todos" className="space-y-4 mt-4">
            {allFeedbacksLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <>
                {/* Filtros */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Select 
                    value={filterUser || "all"} 
                    onValueChange={(v) => setFilterUser(v === "all" ? null : v)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os usuários</SelectItem>
                      {allProfiles?.map(p => (
                        <SelectItem key={p.user_id} value={p.user_id}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    value={filterMentorado || "all"} 
                    onValueChange={(v) => setFilterMentorado(v === "all" ? null : v)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por mentorado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os mentorados</SelectItem>
                      {mentorados?.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {(filterUser || filterMentorado) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => { setFilterUser(null); setFilterMentorado(null); }}
                    >
                      <X className="h-4 w-4 mr-1" /> Limpar filtros
                    </Button>
                  )}
                </div>

                {/* Stats Cards para todos (filtrado) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total Registros</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{filteredStats.totalFeedbacks}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Média Headlines</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{filteredStats.avgHeadlines} min</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Média Roteiros</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{filteredStats.avgRoteiros} min</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Média Total</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-primary">{filteredStats.avgTotal} min</p>
                    </CardContent>
                  </Card>
                </div>

                {renderFeedbackTable(filteredFeedbacks, true)}
              </>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Registros</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{myStats.totalFeedbacks}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Média Headlines</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{myStats.avgHeadlines} min</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Média Roteiros</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{myStats.avgRoteiros} min</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Média Total</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{myStats.avgTotal} min</p>
              </CardContent>
            </Card>
          </div>

          {renderFeedbackTable(myFeedbacks || [], false)}
        </div>
      )}
    </div>
  );
};

export default Acompanhamento;
