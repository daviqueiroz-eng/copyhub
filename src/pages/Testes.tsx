import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUserRole } from "@/hooks/useAuth";
import { useMedalhasUsuario } from "@/hooks/useMedalhas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Brain, FileText, LogOut, Loader2, Settings } from "lucide-react";
import { MedalhasSection } from "@/components/MedalhasSection";

const Testes = () => {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const { data: profile, isLoading: loadingProfile } = useProfile();
  const { data: userRole } = useUserRole();
  const { data: medalhas = [], isLoading: loadingMedalhas } = useMedalhasUsuario();

  if (loading || loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const getInitials = (nome: string) => {
    const names = nome.split(" ");
    return names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : nome.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative">
      {/* User Info - Top Right */}
      <div className="absolute top-8 right-8 flex items-center gap-4">
        {userRole === "admin" && (
          <Button variant="outline" size="icon" onClick={() => navigate("/admin")}>
            <Settings className="h-5 w-5" />
          </Button>
        )}
        <div className="text-right">
          <p className="font-medium text-foreground">{profile?.nome || "Usuário"}</p>
          {!loadingMedalhas && medalhas.length > 0 && (
            <div className="flex gap-1 justify-end mt-1">
              {medalhas.slice(0, 3).map((m: any) => (
                <span key={m.id} className="text-xl" title={m.medalhas?.nome}>
                  {m.medalhas?.icone}
                </span>
              ))}
              {medalhas.length > 3 && (
                <span className="text-xs text-muted-foreground">+{medalhas.length - 3}</span>
              )}
            </div>
          )}
        </div>
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials(profile?.nome || "U")}
          </AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" onClick={signOut}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Teste de Conhecimento
          </h1>
          <p className="text-muted-foreground text-lg">
            Escolha um dos jogos abaixo para testar suas habilidades
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Trinka Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigate("/testes/trinka")}>
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Trinka</CardTitle>
              <CardDescription className="text-base">
                Teste rápido de geração de ideias por nicho
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Gere o máximo de ideias de conteúdo possíveis em tempo limitado para diferentes nichos.
              </p>
              <Button className="w-full" onClick={() => navigate("/testes/trinka")}>
                Jogar Trinka
              </Button>
            </CardContent>
          </Card>

          {/* Análise de Roteiro Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigate("/testes/analise-roteiro")}>
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition-colors">
                  <FileText className="h-8 w-8 text-secondary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Análise de Roteiro</CardTitle>
              <CardDescription className="text-base">
                Identifique elementos-chave em roteiros diários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Analise roteiros sublinhando elementos como gatilhos, CTAs e outros componentes importantes.
              </p>
              <Button variant="secondary" className="w-full" onClick={() => navigate("/testes/analise-roteiro")}>
                Jogar Análise de Roteiro
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Medalhas Section */}
        <MedalhasSection />
      </div>
    </div>
  );
};

export default Testes;
