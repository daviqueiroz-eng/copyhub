import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useProgressoAtividadesGerais, useDetalhesAtividadeGeral } from "@/hooks/useProgressoAtividadesGerais";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const StatusBadge = ({ status }: { status: string }) => {
  const variants = {
    done: { label: "Concluído", icon: CheckCircle2, variant: "default" as const },
    doing: { label: "Em Progresso", icon: Clock, variant: "secondary" as const },
    todo: { label: "A Fazer", icon: AlertCircle, variant: "outline" as const },
  };

  const config = variants[status as keyof typeof variants] || variants.todo;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

const DetalheAtividade = ({ atividadeId }: { atividadeId: string }) => {
  const { data: detalhes, isLoading } = useDetalhesAtividadeGeral(atividadeId);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground p-4">Carregando detalhes...</div>;
  }

  if (!detalhes || detalhes.length === 0) {
    return <div className="text-sm text-muted-foreground p-4">Nenhum usuário encontrado.</div>;
  }

  return (
    <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
      {detalhes.map((detalhe) => (
        <div key={detalhe.id} className="flex items-center justify-between gap-4 p-2 bg-background rounded-md">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={detalhe.user.avatar || undefined} />
              <AvatarFallback>{detalhe.user.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm">{detalhe.user.nome}</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={detalhe.status} />
            <span className="text-xs text-muted-foreground">
              {format(new Date(detalhe.updated_at), "dd/MM HH:mm", { locale: ptBR })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const getPrioridadeBadge = (prioridade: string) => {
  const variants = {
    baixa: { label: "Baixa", variant: "outline" as const },
    media: { label: "Média", variant: "secondary" as const },
    alta: { label: "Alta", variant: "destructive" as const },
  };

  const config = variants[prioridade as keyof typeof variants] || variants.media;

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
};

export function AtividadesGeraisStatus() {
  const { data: progressos, isLoading } = useProgressoAtividadesGerais();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Carregando acompanhamento...</div>
      </div>
    );
  }

  if (!progressos || progressos.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma atividade geral criada ainda.</p>
            <p className="text-sm mt-2">Crie uma atividade na aba "Atividades Gerais" para começar.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {progressos.map((progresso) => {
        const isExpanded = expandedId === progresso.atividade_id;

        return (
          <Card key={progresso.atividade_id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <CardTitle className="text-lg">{progresso.titulo}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    {getPrioridadeBadge(progresso.prioridade)}
                    <Badge variant="outline">{progresso.tipo}</Badge>
                    {progresso.data_limite && (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(progresso.data_limite), "dd/MM/yyyy", { locale: ptBR })}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-semibold">{progresso.percentual_conclusao}%</span>
                </div>
                <Progress value={progresso.percentual_conclusao} className="h-2" />
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold">{progresso.total_usuarios}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-600">{progresso.usuarios_concluidos}</div>
                  <div className="text-xs text-muted-foreground">Concluídos</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-orange-600">{progresso.usuarios_pendentes}</div>
                  <div className="text-xs text-muted-foreground">Pendentes</div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setExpandedId(isExpanded ? null : progresso.atividade_id)}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Ocultar detalhes
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Ver detalhes por usuário
                  </>
                )}
              </Button>

              {isExpanded && <DetalheAtividade atividadeId={progresso.atividade_id} />}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
