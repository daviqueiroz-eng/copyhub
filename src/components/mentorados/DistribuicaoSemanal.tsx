import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mentorado } from "@/hooks/useMentorados";
import { useDistribuirEntregas } from "@/hooks/useDistribuirEntregas";
import { format, addDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DistribuicaoSemanalProps {
  mentorados: Mentorado[];
}

interface PreviewEntrega {
  mentorado: Mentorado;
  leva: number;
  data: Date;
  diaSemana: string;
}

export function DistribuicaoSemanal({ mentorados }: DistribuicaoSemanalProps) {
  const [dataInicio, setDataInicio] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [diasSemana, setDiasSemana] = useState<number[]>([1, 2, 3, 4, 5]); // seg-sex
  const [preview, setPreview] = useState<PreviewEntrega[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const distribuir = useDistribuirEntregas();

  const diasDaSemana = [
    { valor: 1, nome: "Seg" },
    { valor: 2, nome: "Ter" },
    { valor: 3, nome: "Qua" },
    { valor: 4, nome: "Qui" },
    { valor: 5, nome: "Sex" },
    { valor: 6, nome: "Sáb" },
    { valor: 0, nome: "Dom" },
  ];

  const toggleDiaSemana = (dia: number) => {
    setDiasSemana((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia].sort()
    );
  };

  const gerarPreview = () => {
    if (mentorados.length === 0 || diasSemana.length === 0) {
      return;
    }

    const entregas: PreviewEntrega[] = [];
    let diaAtual = new Date(dataInicio);
    let indiceMentorado = 0;

    // Gerar entregas para 6 levas de cada mentorado
    const totalEntregas = mentorados.length * 6;
    let entregasCriadas = 0;

    while (entregasCriadas < totalEntregas) {
      const diaSemanaAtual = diaAtual.getDay();

      // Verificar se o dia atual está nos dias selecionados
      if (diasSemana.includes(diaSemanaAtual)) {
        const mentorado = mentorados[indiceMentorado % mentorados.length];
        const leva = Math.floor(indiceMentorado / mentorados.length) + 1;

        entregas.push({
          mentorado,
          leva,
          data: new Date(diaAtual),
          diaSemana: format(diaAtual, "EEEE", { locale: ptBR }),
        });

        indiceMentorado++;
        entregasCriadas++;
      }

      // Avançar para o próximo dia
      diaAtual = addDays(diaAtual, 1);
    }

    setPreview(entregas);
    setShowPreview(true);
  };

  const aplicarDistribuicao = () => {
    distribuir.mutate({
      dataInicio,
      diasSemana,
      mentorados,
    });
    setShowPreview(false);
  };

  // Agrupar preview por semana
  const previewPorSemana = preview.reduce((acc, entrega) => {
    const semana = format(entrega.data, "'Semana de' dd/MM", { locale: ptBR });
    if (!acc[semana]) {
      acc[semana] = [];
    }
    acc[semana].push(entrega);
    return acc;
  }, {} as Record<string, PreviewEntrega[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurar Distribuição Automática</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seletor de Data Inicial */}
          <div className="space-y-2">
            <Label>Data Inicial</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataInicio && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataInicio ? format(dataInicio, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataInicio}
                  onSelect={(date) => date && setDataInicio(date)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Seletor de Dias da Semana */}
          <div className="space-y-3">
            <Label>Dias da Semana para Entregas</Label>
            <div className="flex flex-wrap gap-2">
              {diasDaSemana.map((dia) => (
                <div key={dia.valor} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dia-${dia.valor}`}
                    checked={diasSemana.includes(dia.valor)}
                    onCheckedChange={() => toggleDiaSemana(dia.valor)}
                  />
                  <Label htmlFor={`dia-${dia.valor}`} className="cursor-pointer">
                    {dia.nome}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={gerarPreview} className="flex-1" disabled={diasSemana.length === 0}>
              Gerar Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview da Distribuição */}
      {showPreview && preview.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Preview da Distribuição</CardTitle>
            <Button onClick={aplicarDistribuicao} disabled={distribuir.isPending}>
              {distribuir.isPending ? "Aplicando..." : "Aplicar Distribuição"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 max-h-[600px] overflow-y-auto">
              {Object.entries(previewPorSemana).map(([semana, entregas]) => (
                <div key={semana} className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">{semana}</h3>
                  <div className="space-y-2">
                    {entregas.map((entrega, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium min-w-[80px]">
                            {format(entrega.data, "EEE, dd/MM", { locale: ptBR })}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{entrega.mentorado.nome}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{entrega.leva}ª Leva</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>{preview.length}</strong> entregas serão criadas automaticamente
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
