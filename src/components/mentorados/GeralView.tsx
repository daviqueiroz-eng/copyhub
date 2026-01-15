import { MentoradoCard } from "./MentoradoCard";
import { Mentorado } from "@/hooks/useMentorados";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Instagram } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GeralViewProps {
  mentorados: Mentorado[];
  searchTerm: string;
  onMentoradoClick: (mentorado: Mentorado) => void;
}

export function GeralView({ mentorados, searchTerm, onMentoradoClick }: GeralViewProps) {
  const { toast } = useToast();

  const filteredMentorados = mentorados.filter((m) =>
    m.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mentoradosWithInstagram = filteredMentorados.filter(m => m.instagram);

  const handleOpenAllInstagrams = async () => {
    if (mentoradosWithInstagram.length === 0) {
      toast({
        title: "Nenhum Instagram cadastrado",
        description: "Não há mentorados com Instagram cadastrado.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: `Abrindo ${mentoradosWithInstagram.length} perfis`,
      description: "Se o navegador bloquear, permita pop-ups para este site.",
    });

    const openInstagramLink = (handle: string) => {
      const link = document.createElement('a');
      link.href = `https://instagram.com/${handle}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    for (let i = 0; i < mentoradosWithInstagram.length; i++) {
      const handle = mentoradosWithInstagram[i]?.instagram?.replace(/^@/, "");
      if (handle) {
        openInstagramLink(handle);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-14rem)]">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3 pb-2 border-b sticky top-0 bg-background z-10">
          <span className="font-semibold text-sm">Mentorados</span>
          {mentoradosWithInstagram.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 h-6 text-xs px-2"
              onClick={handleOpenAllInstagrams}
            >
              <Instagram className="h-3 w-3 text-pink-500" />
              ({mentoradosWithInstagram.length})
            </Button>
          )}
        </div>

        {/* Lista de Mentorados */}
        <div className="space-y-2">
          {filteredMentorados.map((mentorado) => (
            <MentoradoCard
              key={mentorado.id}
              mentorado={mentorado}
              onClick={() => onMentoradoClick(mentorado)}
            />
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
