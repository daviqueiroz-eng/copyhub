import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useRankingMensal } from "@/hooks/useRankingMensal";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export const RankingMensal = () => {
  const { data: ranking, isLoading } = useRankingMensal();
  const { user } = useAuth();

  const mesAtual = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });
  const mesCapitalizado = mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1);

  const getMedalIcon = (posicao: number) => {
    switch (posicao) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return null;
    }
  };

  const getPosicaoClasses = (posicao: number, isCurrentUser: boolean) => {
    const baseClasses = "flex items-center gap-4 p-4 rounded-lg transition-all";
    
    if (posicao === 1) {
      return cn(
        baseClasses,
        "bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-2 border-yellow-500/50",
        isCurrentUser && "ring-2 ring-primary"
      );
    }
    if (posicao === 2) {
      return cn(
        baseClasses,
        "bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-2 border-gray-400/50",
        isCurrentUser && "ring-2 ring-primary"
      );
    }
    if (posicao === 3) {
      return cn(
        baseClasses,
        "bg-gradient-to-r from-orange-500/20 to-orange-600/10 border-2 border-orange-500/50",
        isCurrentUser && "ring-2 ring-primary"
      );
    }
    
    return cn(
      baseClasses,
      "bg-card hover:bg-accent/50",
      isCurrentUser && "ring-2 ring-primary"
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          <div>
            <h3 className="text-xl font-bold">Ranking do Mês</h3>
            <p className="text-sm text-muted-foreground">{mesCapitalizado}</p>
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!ranking || ranking.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          <div>
            <h3 className="text-xl font-bold">Ranking do Mês</h3>
            <p className="text-sm text-muted-foreground">{mesCapitalizado}</p>
          </div>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhuma análise completada este mês ainda.</p>
          <p className="text-sm mt-2">Seja o primeiro a analisar um roteiro! 🚀</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-xl font-bold">Ranking do Mês</h3>
          <p className="text-sm text-muted-foreground">{mesCapitalizado}</p>
        </div>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {ranking.map((usuario) => {
            const isCurrentUser = user?.id === usuario.user_id;
            const medalIcon = getMedalIcon(usuario.posicao);

            return (
              <div
                key={usuario.user_id}
                className={getPosicaoClasses(usuario.posicao, isCurrentUser)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-[60px]">
                    {medalIcon ? (
                      <span className="text-2xl">{medalIcon}</span>
                    ) : (
                      <span className="text-lg font-semibold text-muted-foreground w-8">
                        {usuario.posicao}º
                      </span>
                    )}
                  </div>

                  <Avatar className="h-10 w-10 border-2 border-background">
                    <AvatarImage src={usuario.avatar || undefined} />
                    <AvatarFallback>
                      {usuario.nome
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {usuario.nome}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-primary">(Você)</span>
                      )}
                    </p>
                  </div>
                </div>

                <Badge variant="secondary" className="ml-auto">
                  {usuario.total_analises} análise{usuario.total_analises !== 1 ? "s" : ""}
                </Badge>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
