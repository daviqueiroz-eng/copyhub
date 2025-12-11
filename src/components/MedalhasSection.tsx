import { useMedalhas, useMedalhasUsuario } from "@/hooks/useMedalhas";
import { useProgressoRoteiros } from "@/hooks/useProgressoRoteiros";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Flame } from "lucide-react";

interface MedalhasSectionProps {
  streak?: number;
  medalhasCount?: number;
}

export const MedalhasSection = ({ streak, medalhasCount }: MedalhasSectionProps) => {
  const { data: todasMedalhas = [], isLoading: loadingMedalhas } = useMedalhas();
  const { data: medalhasUsuario = [], isLoading: loadingMedalhasUsuario } = useMedalhasUsuario();
  const { data: progresso = [], isLoading: loadingProgresso } = useProgressoRoteiros();

  if (loadingMedalhas || loadingMedalhasUsuario || loadingProgresso) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const roteirosCompletados = progresso.filter(p => p.completado).length;
  const idsDesbloqueados = medalhasUsuario.map((m: any) => m.medalha_id);

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>🏆 Suas Medalhas</CardTitle>
        <CardDescription>
          Complete roteiros para desbloquear novas conquistas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Streak e Medalhas Conquistadas */}
        <div className="flex flex-col sm:flex-row gap-3">
          {streak !== undefined && streak > 0 && (
            <div className="flex-1 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Sequência Atual</p>
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {streak} {streak === 1 ? 'dia' : 'dias'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {medalhasCount !== undefined && (
            <div className="flex-1 text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{medalhasCount}</p>
              <p className="text-xs text-muted-foreground">Medalhas Conquistadas</p>
            </div>
          )}
        </div>

        {/* Lista de medalhas */}
        <div className="grid gap-3">
          {todasMedalhas.map((medalha) => {
            const desbloqueada = idsDesbloqueados.includes(medalha.id);
            const progressoMedalha = Math.min((roteirosCompletados / medalha.roteiros_necessarios) * 100, 100);

            return (
              <div
                key={medalha.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  desbloqueada
                    ? "bg-primary/5 border-primary/20"
                    : "bg-muted/30 border-border opacity-60"
                }`}
              >
                <div className={`text-3xl ${!desbloqueada && "grayscale opacity-50"}`}>
                  {medalha.icone}
                </div>
                <div className="flex-1 space-y-1">
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">
                      {medalha.nome}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {medalha.descricao}
                    </p>
                  </div>
                  {!desbloqueada && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{roteirosCompletados} / {medalha.roteiros_necessarios}</span>
                        <span>{Math.floor(progressoMedalha)}%</span>
                      </div>
                      <Progress value={progressoMedalha} className="h-1.5" />
                    </div>
                  )}
                  {desbloqueada && (
                    <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                      ✓ Desbloqueada
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
