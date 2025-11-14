interface CircularTimerProps {
  segundosRestantes: number;
  totalSegundos: number;
}

export const CircularTimer = ({ segundosRestantes, totalSegundos }: CircularTimerProps) => {
  const raio = 120;
  const circunferencia = 2 * Math.PI * raio;
  const progresso = ((totalSegundos - segundosRestantes) / totalSegundos) * 100;
  const offset = circunferencia - (progresso / 100) * circunferencia;

  const formatTime = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="relative w-80 h-80">
      <svg className="transform -rotate-90 w-full h-full">
        {/* Círculo de fundo */}
        <circle
          cx="160"
          cy="160"
          r={raio}
          stroke="currentColor"
          strokeWidth="12"
          fill="none"
          className="text-muted"
        />
        {/* Círculo de progresso animado */}
        <circle
          cx="160"
          cy="160"
          r={raio}
          stroke="currentColor"
          strokeWidth="12"
          fill="none"
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
          className="text-primary transition-all duration-1000 ease-linear"
          strokeLinecap="round"
        />
      </svg>
      
      {/* Tempo no centro */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-7xl font-bold font-mono text-foreground">
          {formatTime(segundosRestantes)}
        </span>
      </div>
    </div>
  );
};
