import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGoogleCalendarEvents } from "@/hooks/useGoogleCalendar";
import { Calendar, Link as LinkIcon, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export default function Calendario() {
  const { user, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Debug logs
  console.log('User metadata:', user?.app_metadata);
  console.log('Providers:', user?.app_metadata?.providers);
  
  // Verificar se tem provider_token do Google
  const hasGoogleConnected = user?.app_metadata?.providers?.includes('google');
  const providerTokenExists = Boolean((session as any)?.provider_token);
  const canFetch = !!session && providerTokenExists;
  console.log('hasGoogleConnected:', hasGoogleConnected, 'session?', !!session, 'providerToken?', providerTokenExists, 'canFetch:', canFetch);
  
  // Só buscar eventos se estiver conectado e com token válido
  const { data: events, isLoading, error } = useGoogleCalendarEvents(canFetch);

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    // Fazer logout e redirecionar para página de login com Google
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendário da Equipe</h1>
        <p className="text-muted-foreground mt-2">
          Visualize e gerencie eventos e compromissos da equipe
        </p>
      </div>

      {!hasGoogleConnected ? (
        <Card className="p-8">
          <div className="flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-12 w-12 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold">Login com Google Necessário</h3>
              <p className="text-muted-foreground">
                Para acessar o Google Calendar, você precisa fazer login com sua conta Google.
                Você será redirecionado para a página de login.
              </p>
            </div>
            
            <Alert>
              <AlertDescription>
                Após fazer login com Google, você terá acesso automático aos seus eventos do calendário.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
                  <div>
                    <div className="font-medium">Sincronização automática</div>
                    <div className="text-muted-foreground">Entregas viram eventos</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
                  <div>
                    <div className="font-medium">Totalmente seguro</div>
                    <div className="text-muted-foreground">OAuth 2.0 do Google</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
                  <div>
                    <div className="font-medium">Controle total</div>
                    <div className="text-muted-foreground">Revogue a qualquer momento</div>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              size="lg" 
              onClick={handleConnectGoogle}
              disabled={isConnecting}
              className="w-full max-w-xs"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Redirecionando...
                </>
              ) : (
                <>
                  <LinkIcon className="mr-2 h-5 w-5" />
                  Fazer Login com Google
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              Ao conectar, você autoriza este aplicativo a acessar e gerenciar 
              eventos no seu Google Calendar
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              Google Calendar Conectado
            </Badge>
          </div>

          {!providerTokenExists && (
            <Alert>
              <AlertDescription>
                Sua sessão atual não possui acesso ao Google Calendar. Faça login novamente com Google para renovar as permissões.
              </AlertDescription>
            </Alert>
          )}

            {error && (
            <Alert variant="destructive">
              <AlertDescription>
                Erro ao carregar eventos: {error.message}
              </AlertDescription>
            </Alert>
          )}

          <Card className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : events && events.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Próximos Eventos</h3>
                <div className="space-y-2">
                  {events.slice(0, 10).map((event: any) => (
                    <div 
                      key={event.id}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="h-10 w-1 rounded-full" style={{ backgroundColor: `var(--chart-${event.colorId || 1})` }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{event.summary}</div>
                        <div className="text-sm text-muted-foreground">
                          {event.start?.dateTime && format(new Date(event.start.dateTime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                        {event.description && (
                          <div className="text-xs text-muted-foreground mt-1">{event.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum evento encontrado
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
