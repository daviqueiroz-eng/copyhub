import { useState } from "react";
import { CalendarDays, Table2, Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGestaoEntregas } from "@/hooks/useGestaoEntregas";
import { GestaoCalendarioView } from "./GestaoCalendarioView";
import { GestaoTabelaView } from "./GestaoTabelaView";
import { GestaoEntregaDialog } from "./GestaoEntregaDialog";
import * as XLSX from "xlsx";

export const GestaoEntregasView = () => {
  const { data: entregas = [], isLoading } = useGestaoEntregas();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleExport = () => {
    const rows = entregas.map((e) => ({
      Mentorado: e.mentorado?.nome || "",
      Mentor: e.mentorado?.mentor || "",
      Curso: e.mentorado?.curso || "",
      Leva: e.leva || "",
      Prazo: e.prazo || "",
      "Data Entrega": e.data_entrega || "",
      "Dias Úteis": e.dias_uteis,
      Status: e.status,
      Pausado: e.mentorado?.pausado ? "Sim" : "Não",
      Observação: e.observacao || "",
      Copy: e.responsavel?.nome || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Entregas");
    XLSX.writeFile(wb, "entregas.xlsx");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Carregando entregas...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="calendario" className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between shrink-0 mb-3">
          <TabsList>
            <TabsTrigger value="calendario" className="gap-1.5">
              <CalendarDays className="h-4 w-4" /> Calendário
            </TabsTrigger>
            <TabsTrigger value="tabela" className="gap-1.5">
              <Table2 className="h-4 w-4" /> Tabela
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
              <Download className="h-4 w-4" /> Exportar
            </Button>
            <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Nova Entrega
            </Button>
          </div>
        </div>

        <TabsContent value="calendario" className="flex-1 min-h-0 mt-0">
          <GestaoCalendarioView entregas={entregas} />
        </TabsContent>

        <TabsContent value="tabela" className="flex-1 min-h-0 mt-0">
          <GestaoTabelaView entregas={entregas} />
        </TabsContent>
      </Tabs>

      <GestaoEntregaDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
};
