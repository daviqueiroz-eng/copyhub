import { useState } from "react";
import { usePomodoro } from "@/contexts/PomodoroContext";
import { usePomodoroEstatisticas } from "@/hooks/usePomodoroSessoes";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";
import { CircularTimer } from "./CircularTimer";
import { PomodoroConfigDialog } from "./PomodoroConfigDialog";
import { format } from "date-fns";
import YouTube from "react-youtube";

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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* ========== COLUNA ESQUERDA: TIMER ========== */}
          <div className="flex flex-col items-center justify-center space-y-8">
            {/* Breadcrumb */}
            <div className="self-start">
              <span className="text-gray-400">Foco →</span>
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
              className="w-48 h-14 text-lg rounded-full bg-blue-500 hover:bg-blue-600 text-white"
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
                className="bg-transparent border-gray-600 hover:bg-gray-800 text-white"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Resetar
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfig(true)}
                className="bg-transparent border-gray-600 hover:bg-gray-800 text-white"
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
              <Card className="bg-gray-800 border-gray-700 p-4">
                <p className="text-gray-400 text-sm">Pomos de hoje</p>
                <p className="text-4xl font-bold mt-2">{estatisticas?.pomosHoje || 0}</p>
              </Card>

              {/* Foco de hoje */}
              <Card className="bg-gray-800 border-gray-700 p-4">
                <p className="text-gray-400 text-sm">Foco de hoje</p>
                <p className="text-4xl font-bold mt-2">
                  {estatisticas?.focoHoje || 0} <span className="text-lg">m</span>
                </p>
              </Card>

              {/* Pomos totais */}
              <Card className="bg-gray-800 border-gray-700 p-4">
                <p className="text-gray-400 text-sm">Pomos totais</p>
                <p className="text-4xl font-bold mt-2">{estatisticas?.pomosTotal || 0}</p>
              </Card>

              {/* Duração Total */}
              <Card className="bg-gray-800 border-gray-700 p-4">
                <p className="text-gray-400 text-sm">Duração Total Focada</p>
                <p className="text-2xl font-bold mt-2">
                  {estatisticas ? formatDuracao(estatisticas.duracaoTotal) : "0 m"}
                </p>
              </Card>
            </div>

            {/* Histórico de Sessões */}
            <Card className="bg-gray-800 border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Foco em Registro</h3>
              </div>

              {/* Lista de Sessões Agrupadas por Data */}
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {estatisticas?.sessoesAgrupadas && 
                  Object.entries(estatisticas.sessoesAgrupadas).map(([data, sessoes]) => (
                    <div key={data}>
                      <p className="text-gray-400 text-sm mb-2">{data}</p>
                      <div className="space-y-2">
                        {sessoes.map(sessao => (
                          <div
                            key={sessao.id}
                            className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 transition"
                          >
                            {/* Ícone do tipo */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                              sessao.tipo === "trabalho" ? "bg-blue-500" : "bg-green-500"
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
                            <p className="text-xs text-gray-400">
                              {sessao.duracao_minutos}m
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                {(!estatisticas?.sessoesAgrupadas || Object.keys(estatisticas.sessoesAgrupadas).length === 0) && (
                  <p className="text-center text-gray-500 py-8">
                    Nenhuma sessão registrada ainda
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Player YouTube invisível (roda em background) */}
      {videoId && (
        <div className="fixed bottom-0 right-0 w-1 h-1 opacity-0 pointer-events-none">
          <YouTube
            videoId={videoId}
            opts={{
              playerVars: {
                autoplay: 0,
                controls: 0,
              },
            }}
            onReady={(event) => {
              playerRef.current = event.target;
            }}
          />
        </div>
      )}

      {/* Dialog de Configurações */}
      <PomodoroConfigDialog open={showConfig} onOpenChange={setShowConfig} />
    </>
  );
};