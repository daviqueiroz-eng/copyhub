import { Flame } from "lucide-react";

interface ViralAprovadoToastProps {
  comissao?: string;
  onClick?: () => void;
}

export const ViralAprovadoToast = ({
  comissao = "R$297,73",
  onClick,
}: ViralAprovadoToastProps) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 cursor-pointer rounded-md p-3 min-w-[280px] shadow-lg"
      style={{
        background: "linear-gradient(135deg, hsl(155 50% 45%), hsl(155 60% 38%))",
        color: "white",
      }}
    >
      <div className="flex items-center justify-center h-10 w-10 rounded-md bg-black/20">
        <Flame className="h-5 w-5 text-white" />
      </div>
      <div className="flex flex-col leading-tight">
        <span
          className="font-semibold text-[15px]"
          style={{ fontFamily: "'Caveat', 'Comic Sans MS', cursive" }}
        >
          Viral Aprovado!!
        </span>
        <span
          className="text-[13px] opacity-95"
          style={{ fontFamily: "'Caveat', 'Comic Sans MS', cursive" }}
        >
          Sua comissão {comissao}
        </span>
      </div>
    </div>
  );
};