import { useState, useEffect } from "react";

const STREAK_KEY = "analysis_streak_count";
const DATE_KEY = "analysis_last_date";

export const useAnalysisStreak = () => {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(STREAK_KEY);
    setStreak(saved ? parseInt(saved) : 0);
  }, []);

  const updateStreak = () => {
    const hoje = new Date().toDateString();
    const ultimaData = localStorage.getItem(DATE_KEY);

    let novoStreak = 1;

    if (ultimaData) {
      const dataUltima = new Date(ultimaData);
      const dataHoje = new Date();
      const diffMs = dataHoje.getTime() - dataUltima.getTime();
      const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDias === 0) {
        // Mesmo dia - não muda
        const current = localStorage.getItem(STREAK_KEY);
        novoStreak = current ? parseInt(current) : 1;
      } else if (diffDias === 1) {
        // Consecutivo
        const current = localStorage.getItem(STREAK_KEY);
        novoStreak = (current ? parseInt(current) : 0) + 1;
      }
      // Se diffDias > 1, reseta para 1 (já definido acima)
    }

    localStorage.setItem(STREAK_KEY, novoStreak.toString());
    localStorage.setItem(DATE_KEY, hoje);
    setStreak(novoStreak);
  };

  return { streak, updateStreak };
};
