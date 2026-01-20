import { MentoradoCard } from "./MentoradoCard";
import { Mentorado } from "@/hooks/useMentorados";
import { Button } from "@/components/ui/button";
import { Instagram } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// TikTok icon component
const TiktokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

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
  const mentoradosWithTiktok = filteredMentorados.filter(m => m.tiktok);

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

  const handleOpenAllTiktoks = async () => {
    if (mentoradosWithTiktok.length === 0) {
      toast({
        title: "Nenhum TikTok cadastrado",
        description: "Não há mentorados com TikTok cadastrado.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: `Abrindo ${mentoradosWithTiktok.length} perfis TikTok`,
      description: "Se o navegador bloquear, permita pop-ups para este site.",
    });

    const openTiktokLink = (handle: string) => {
      const link = document.createElement('a');
      link.href = `https://tiktok.com/@${handle}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    for (let i = 0; i < mentoradosWithTiktok.length; i++) {
      const handle = mentoradosWithTiktok[i]?.tiktok?.replace(/^@/, "");
      if (handle) {
        openTiktokLink(handle);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header fixo */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b shrink-0">
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
        {mentoradosWithTiktok.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1 h-6 text-xs px-2"
            onClick={handleOpenAllTiktoks}
          >
            <TiktokIcon className="h-3 w-3" />
            ({mentoradosWithTiktok.length})
          </Button>
        )}
      </div>

      {/* Lista de Mentorados com scroll */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-1">
        {filteredMentorados.map((mentorado) => (
          <MentoradoCard
            key={mentorado.id}
            mentorado={mentorado}
            onClick={() => onMentoradoClick(mentorado)}
          />
        ))}
      </div>
    </div>
  );
}
