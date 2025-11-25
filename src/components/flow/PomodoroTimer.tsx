import { useState } from "react";
import { usePomodoro } from "@/contexts/PomodoroContext";
import { usePomodoroEstatisticas } from "@/hooks/usePomodoroSessoes";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";
import { CircularTimer } from "./CircularTimer";
import { PomodoroConfigDialog } from "./PomodoroConfigDialog";
import { PomodoroRestDialog } from "./PomodoroRestDialog";
import { format } from "date-fns";

export const PomodoroTimer = () => {
  const [showConfig, setShowConfig] = useState(false);
  
  const {
    segundosRestantes,
    tempoCustomizado,
    modo,
    isRunning,
    toggleTimer,
    resetTimer,
    playerRef,
    videoId,
    showRestDialog,
    setShowRestDialog,
    setModo,
    setTempoCustomizado,
    setIsRunning,
    PRESETS,
  } = usePomodoro();

  const estatisticas = usePomodoroEstatisticas();
  const totalSegundos = tempoCustomizado || PRESETS[modo];

  const formatDuracao = (minutos: number) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return horas > 0 ? `${horas} h ${mins} m` : `${mins} m`;
  };

  return (
    <>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* ========== COLUNA ESQUERDA: TIMER ========== */}
          <div className="flex flex-col items-center justify-center space-y-8">
            {/* Breadcrumb */}
            <div className="self-start">
              <span className="text-muted-foreground">Foco →</span>
            </div>

            {/* Timer Circular */}
            <div className="relative">
              <CircularTimer
                segundosRestantes={segundosRestantes}
                totalSegundos={totalSegundos}
              />
            </div>

            {/* Botão Principal */}
            <Button
              size="lg"
              className="w-48 h-14 text-lg rounded-full bg-primary hover:bg-primary/90"
              onClick={toggleTimer}
            >
              {isRunning ? (
                <>
                  <Pause className="mr-2" /> Pausar
                </>
              ) : (
                <>
                  <Play className="mr-2" /> Começar
                </>
              )}
            </Button>

            {/* Botões secundários */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={resetTimer}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Resetar
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfig(true)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Configurar
              </Button>
            </div>
          </div>

          {/* ========== COLUNA DIREITA: ESTATÍSTICAS + HISTÓRICO ========== */}
          <div className="space-y-6">
            
            {/* Grid de Estatísticas (2x2) */}
            <div className="grid grid-cols-2 gap-4">
              {/* Pomos de hoje */}
              <Card className="p-4">
                <p className="text-muted-foreground text-sm">Pomos de hoje</p>
                <p className="text-4xl font-bold mt-2">{estatisticas?.pomosHoje || 0}</p>
              </Card>

              {/* Foco de hoje */}
              <Card className="p-4">
                <p className="text-muted-foreground text-sm">Foco de hoje</p>
                <p className="text-4xl font-bold mt-2">
                  {estatisticas?.focoHoje || 0} <span className="text-lg">m</span>
                </p>
              </Card>

              {/* Pomos totais */}
              <Card className="p-4">
                <p className="text-muted-foreground text-sm">Pomos totais</p>
                <p className="text-4xl font-bold mt-2">{estatisticas?.pomosTotal || 0}</p>
              </Card>

              {/* Duração Total */}
              <Card className="p-4">
                <p className="text-muted-foreground text-sm">Duração Total Focada</p>
                <p className="text-2xl font-bold mt-2">
                  {estatisticas ? formatDuracao(estatisticas.duracaoTotal) : "0 m"}
                </p>
              </Card>
            </div>

            {/* Histórico de Sessões */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Foco em Registro</h3>
              </div>

              {/* Lista de Sessões Agrupadas por Data */}
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {estatisticas?.sessoesAgrupadas && 
                  Object.entries(estatisticas.sessoesAgrupadas).map(([data, sessoes]) => (
                    <div key={data}>
                      <p className="text-muted-foreground text-sm mb-2">{data}</p>
                      <div className="space-y-2">
                        {sessoes.map(sessao => (
                          <div
                            key={sessao.id}
                            className="flex items-center gap-3 p-2 rounded hover:bg-muted transition"
                          >
                            {/* Ícone do tipo */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                              sessao.tipo === "trabalho" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                            }`}>
                              🍅
                            </div>

                            {/* Horário */}
                            <div className="flex-1">
                              <p className="text-sm">
                                {format(new Date(sessao.created_at), "HH:mm")} -{" "}
                                {format(new Date(new Date(sessao.created_at).getTime() + sessao.duracao_minutos * 60000), "HH:mm")}
                              </p>
                            </div>

                            {/* Duração */}
                            <p className="text-xs text-muted-foreground">
                              {sessao.duracao_minutos}m
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                {(!estatisticas?.sessoesAgrupadas || Object.keys(estatisticas.sessoesAgrupadas).length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma sessão registrada ainda
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog de Configurações */}
      <PomodoroConfigDialog open={showConfig} onOpenChange={setShowConfig} />
      
      {/* Dialog de Descanso */}
      <PomodoroRestDialog
        open={showRestDialog}
        onClose={() => setShowRestDialog(false)}
        onStartRest={(minutos) => {
          setTempoCustomizado(minutos * 60);
          setModo("pausaCurta");
          setIsRunning(true);
          setShowRestDialog(false);
        }}
      />
    </>
  );
};