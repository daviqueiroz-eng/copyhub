import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Mentorado } from "@/hooks/useMentorados";
import { Entrega } from "@/hooks/useEntregas";
import { format, differenceInDays, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";

interface MentoradoEntregaCardProps {
  mentorado: Mentorado;
  entregaDia: Entrega;
  todasEntregas: Entrega[];
  getLevaColor: (numeroLeva: number) => string;
}

export function MentoradoEntregaCard({
  mentorado,
  entregaDia,
  todasEntregas,
  getLevaColor,
}: MentoradoEntregaCardProps) {
  const hoje = new Date();

  // Calcular status geral do mentorado
  const getStatusMentorado = () => {
    const atrasadas = todasEntregas.filter(
      (e) => !e.concluida && e.data_entrega && isPast(new Date(e.data_entrega))
    );
    const concluidas = todasEntregas.filter((e) => e.concluida).length;

    const proximasEntregas = todasEntregas.filter(
      (e) => !e.concluida && e.data_entrega && !isPast(new Date(e.data_entrega))
    );
    const proximaEmTresDias = proximasEntregas.some(
      (e) => e.data_entrega && differenceInDays(new Date(e.data_entrega), hoje) <= 3
    );

    return {
      status: atrasadas.length > 0 ? "atrasado" : proximaEmTresDias ? "atencao" : "ok",
      atrasos: atrasadas.length,
      concluidas,
      total: 6,
    };
  };

  const status = getStatusMentorado();

  // Buscar próximas entregas (futuras, não concluídas)
  const proximasEntregas = todasEntregas
    .filter((e) => !e.concluida && e.data_entrega && !isPast(new Date(e.data_entrega)))
    .sort((a, b) => new Date(a.data_entrega!).getTime() - new Date(b.data_entrega!).getTime())
    .slice(0, 4);

  const statusConfig = {
    ok: { icon: CheckCircle, color: "text-green-500", label: "Em dia" },
    atencao: { icon: AlertCircle, color: "text-yellow-500", label: "Atenção" },
    atrasado: { icon: AlertCircle, color: "text-red-500", label: "Atrasado" },
  };

  const StatusIcon = statusConfig[status.status].icon;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Cabeçalho com nome e status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={mentorado.avatar || undefined} alt={mentorado.nome} />
              <AvatarFallback
                className="text-primary-foreground"
                style={{ backgroundColor: getLevaColor(entregaDia.numero_leva) }}
              >
                {mentorado.iniciais}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{mentorado.nome}</p>
              {mentorado.plano && (
                <p className="text-xs text-muted-foreground">{mentorado.plano}</p>
              )}
            </div>
          </div>
          <StatusIcon className={`h-6 w-6 ${statusConfig[status.status].color}`} />
        </div>

        {/* Progresso geral */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">
              {status.concluidas} de {status.total} levas
            </span>
          </div>
          <Progress value={(status.concluidas / status.total) * 100} className="h-2" />
        </div>

        {/* Entrega atual do dia */}
        <div className="border-t pt-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Entrega Atual</span>
          </div>
          <div className="ml-6 space-y-1">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getLevaColor(entregaDia.numero_leva) }}
              />
              <span className="text-sm">{entregaDia.numero_leva}ª Leva</span>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                {format(new Date(entregaDia.data_entrega!), "dd/MM/yyyy")}
              </span>
            </div>
            <Badge variant={entregaDia.concluida ? "default" : "secondary"} className="text-xs">
              {entregaDia.concluida ? "Concluída" : "Pendente"}
            </Badge>
            {entregaDia.observacoes && (
              <p className="text-xs text-muted-foreground mt-2">{entregaDia.observacoes}</p>
            )}
          </div>
        </div>

        {/* Próximas entregas */}
        {proximasEntregas.length > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Próximas Entregas</span>
            </div>
            <div className="ml-6 space-y-2">
              {proximasEntregas.map((entrega) => {
                const diasRestantes = differenceInDays(new Date(entrega.data_entrega!), hoje);
                return (
                  <div key={entrega.id} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getLevaColor(entrega.numero_leva) }}
                    />
                    <span>{entrega.numero_leva}ª Leva</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      {format(new Date(entrega.data_entrega!), "dd/MM", { locale: ptBR })}
                    </span>
                    <span className="text-muted-foreground">
                      ({diasRestantes === 0 ? "hoje" : `em ${diasRestantes} dias`})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Situação / Alertas */}
        <div className="border-t pt-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Situação</span>
          </div>
          <div className="ml-6 space-y-1 text-xs">
            {status.atrasos > 0 ? (
              <div className="flex items-center gap-2 text-red-500">
                <AlertCircle className="h-3 w-3" />
                <span className="font-medium">
                  {status.atrasos} {status.atrasos === 1 ? "entrega atrasada" : "entregas atrasadas"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>Sem atrasos</span>
              </div>
            )}
            <p className="text-muted-foreground">
              {status.concluidas} de {status.total} levas concluídas
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
