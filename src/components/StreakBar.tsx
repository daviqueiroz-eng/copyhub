import { useAnalysisStreak } from "@/hooks/useAnalysisStreak";
import { Flame } from "lucide-react";

export const StreakBar = () => {
  const { streak } = useAnalysisStreak();

  if (streak === 0) return null;

  return (
    <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-orange-500/20">
      <div className="container max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-2 text-sm font-medium">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-orange-600 dark:text-orange-400">
            {streak} {streak === 1 ? 'dia' : 'dias'} sem falhar
          </span>
        </div>
      </div>
    </div>
  );
};
