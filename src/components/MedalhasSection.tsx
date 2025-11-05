import { useMedalhas, useMedalhasUsuario } from "@/hooks/useMedalhas";
import { useProgressoRoteiros } from "@/hooks/useProgressoRoteiros";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

export const MedalhasSection = () => {
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>🏆 Suas Medalhas</CardTitle>
        <CardDescription>
          Complete roteiros para desbloquear novas conquistas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {todasMedalhas.map((medalha) => {
            const desbloqueada = idsDesbloqueados.includes(medalha.id);
            const progresso = Math.min((roteirosCompletados / medalha.roteiros_necessarios) * 100, 100);

            return (
              <div
                key={medalha.id}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                  desbloqueada
                    ? "bg-primary/5 border-primary/20"
                    : "bg-muted/30 border-border opacity-60"
                }`}
              >
                <div className={`text-4xl ${!desbloqueada && "grayscale opacity-50"}`}>
                  {medalha.icone}
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {medalha.nome}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {medalha.descricao}
                    </p>
                  </div>
                  {!desbloqueada && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{roteirosCompletados} / {medalha.roteiros_necessarios} roteiros</span>
                        <span>{Math.floor(progresso)}%</span>
                      </div>
                      <Progress value={progresso} className="h-2" />
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
