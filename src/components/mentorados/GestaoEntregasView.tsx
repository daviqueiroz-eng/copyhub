import { useState, useEffect, useMemo } from "react";
import { CalendarDays, Table2, Plus, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGestaoEntregas } from "@/hooks/useGestaoEntregas";
import { useMentorados, useUpdateMentorado } from "@/hooks/useMentorados";
import { GestaoCalendarioView } from "./GestaoCalendarioView";
import { GestaoTabelaView } from "./GestaoTabelaView";
import { GestaoEntregaDialog } from "./GestaoEntregaDialog";
import { CategoriaKanbanDialog } from "./CategoriaKanbanDialog";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";

const CATEGORIAS = [
  { key: "Pausado", color: "bg-yellow-100 text-yellow-800 border-yellow-400 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700" },
  { key: "Churn", color: "bg-red-100 text-red-800 border-red-400 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700" },
  { key: "Acompanhar", color: "bg-blue-100 text-blue-800 border-blue-400 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700" },
  { key: "Finalizado", color: "bg-green-100 text-green-800 border-green-400 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700" },
];

export const GestaoEntregasView = () => {
  const { data: entregas = [], isLoading } = useGestaoEntregas();
  const { data: mentorados = [] } = useMentorados();
  const updateMentorado = useUpdateMentorado();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [kanbanOpen, setKanbanOpen] = useState(false);
  const [kanbanOpen, setKanbanOpen] = useState(false);

  // Count mentorados per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIAS.forEach(c => { counts[c.key] = 0; });
    mentorados.forEach((m: any) => {
      if (m.categoria && counts[m.categoria] !== undefined) {
        counts[m.categoria]++;
      }
    });
    return counts;
  }, [mentorados]);

  // Global mouseup listener for FullCalendar drag to category badges
  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      const mentoradoId = (window as any).__draggedMentoradoId;
      (window as any).__draggedMentoradoId = null;
      if (!mentoradoId) return;

      const el = document.elementFromPoint(e.clientX, e.clientY);
      const badge = el?.closest("[data-category]") as HTMLElement | null;
      if (badge) {
        const cat = badge.dataset.category;
        if (cat) {
          updateMentorado.mutate(
            { id: mentoradoId, categoria: cat } as any,
            {
              onSuccess: () => {
                toast({ title: `Mentorado movido para ${cat}` });
              },
            }
          );
        }
      }
    };
    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [updateMentorado, toast]);

  const handleExport = () => {
    const rows = entregas.map((e) => ({
      Copy: e.responsavel?.nome || "",
      Cliente: e.mentorado?.nome || "",
      Mentor: e.mentor || e.mentorado?.mentor || "",
      Plano: e.mentorado?.curso || "",
      "Leva Atual": e.leva || "",
      "Prazo Atual": e.prazo || "",
      "Levas no Total": e.levas_totais || "",
      "Roteiros por Leva": e.roteiros_por_leva || "",
      Status: e.status,
      Entregas: e.data_entrega || "",
      Observação: e.observacao || "",
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
        <div className="flex items-center justify-between shrink-0 mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <TabsList>
              <TabsTrigger value="calendario" className="gap-1.5">
                <CalendarDays className="h-4 w-4" /> Calendário
              </TabsTrigger>
              <TabsTrigger value="tabela" className="gap-1.5">
                <Table2 className="h-4 w-4" /> Tabela
              </TabsTrigger>
            </TabsList>

            {/* Category badges - droppable + clickable for Kanban */}
            {CATEGORIAS.map((cat) => (
              <div
                key={cat.key}
                data-category={cat.key}
                className="transition-all"
              >
                <Badge
                  variant="outline"
                  className={`cursor-pointer px-3 py-1 text-xs font-medium border-2 ${cat.color} hover:opacity-80 transition-opacity`}
                  onClick={() => setKanbanOpen(true)}
                >
                  {cat.key}
                  {categoryCounts[cat.key] > 0 && (
                    <span className="ml-1.5 text-[10px] opacity-70">({categoryCounts[cat.key]})</span>
                  )}
                </Badge>
              </div>
            ))}
          </div>

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

      <CategoriaKanbanDialog
        open={kanbanOpen}
        onOpenChange={setKanbanOpen}
        mentorados={mentorados}
      />
    </div>
  );
};
