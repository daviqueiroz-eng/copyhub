import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export default function Calendario() {
  const [calendarUrl, setCalendarUrl] = useState(
    localStorage.getItem("googleCalendarUrl") || ""
  );
  const [tempUrl, setTempUrl] = useState(calendarUrl);

  const handleSaveUrl = () => {
    localStorage.setItem("googleCalendarUrl", tempUrl);
    setCalendarUrl(tempUrl);
    toast.success("URL do calendário salva com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendário da Equipe</h1>
        <p className="text-muted-foreground mt-2">
          Visualize e acompanhe os eventos e compromissos da equipe
        </p>
      </div>

      {!calendarUrl ? (
        <Card className="p-6">
          <div className="space-y-4 max-w-2xl">
            <div>
              <h3 className="text-lg font-semibold mb-2">Configure seu Google Calendar</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Para exibir seu calendário, siga os passos abaixo:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-6">
                <li>Acesse o Google Calendar</li>
                <li>Vá em Configurações → Configurações do calendário</li>
                <li>Selecione o calendário desejado</li>
                <li>Role até "Integrar calendário"</li>
                <li>Copie a URL pública do calendário (formato iframe ou URL de incorporação)</li>
                <li>Cole a URL abaixo</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label htmlFor="calendar-url">URL do Google Calendar</Label>
              <Input
                id="calendar-url"
                placeholder="https://calendar.google.com/calendar/embed?src=..."
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Exemplo: https://calendar.google.com/calendar/embed?src=seu_calendario_id
              </p>
            </div>

            <Button onClick={handleSaveUrl} disabled={!tempUrl}>
              Salvar e Exibir Calendário
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCalendarUrl("");
                setTempUrl("");
                localStorage.removeItem("googleCalendarUrl");
                toast.info("URL do calendário removida");
              }}
            >
              Alterar URL
            </Button>
          </div>

          <Card className="w-full overflow-hidden">
            <iframe
              src={calendarUrl}
              className="w-full h-[800px] border-0"
              title="Google Calendar"
              frameBorder="0"
              scrolling="no"
            />
          </Card>
        </>
      )}
    </div>
  );
}
