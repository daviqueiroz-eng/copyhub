import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PartyPopper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";

interface CelebracaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CelebracaoDialog({ open, onOpenChange }: CelebracaoDialogProps) {
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      // Buscar foto aleatória
      const fetchFotoAleatoria = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("fotos_celebracao")
          .select("url");

        if (!error && data && data.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.length);
          setFotoUrl(data[randomIndex].url);
        } else {
          setFotoUrl(null);
        }
        setIsLoading(false);
      };

      fetchFotoAleatoria();

      // Disparar confetes
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ["#FFD700", "#FFA500", "#FF6347", "#9370DB", "#00CED1"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ["#FFD700", "#FFA500", "#FF6347", "#9370DB", "#00CED1"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [open]);

  // Se não houver foto, não mostrar o dialog
  if (!open || (!isLoading && !fotoUrl)) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-transparent border-none shadow-none">
        <div className="relative bg-background rounded-lg overflow-hidden">
          {/* Header */}
          <div className="text-center py-4 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20">
            <div className="flex items-center justify-center gap-2 text-2xl font-bold">
              <PartyPopper className="h-8 w-8 text-yellow-500" />
              <span className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                PARABÉNS!
              </span>
              <PartyPopper className="h-8 w-8 text-yellow-500 scale-x-[-1]" />
            </div>
          </div>

          {/* Imagem */}
          <div className="p-4">
            {isLoading ? (
              <div className="w-full h-80 bg-muted animate-pulse rounded-lg" />
            ) : (
              <img
                src={fotoUrl!}
                alt="Celebração"
                className="w-full max-h-[60vh] object-contain rounded-lg"
              />
            )}
          </div>

          {/* Footer */}
          <div className="text-center pb-6 px-4">
            <p className="text-muted-foreground mb-4">
              Você completou mais uma análise de roteiro!
            </p>
            <Button
              size="lg"
              onClick={() => onOpenChange(false)}
              className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-white"
            >
              Continuar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
