import { useState, useMemo } from "react";
import { format, isBefore, startOfDay, addDays } from "date-fns";
import { Search, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { GestaoEntrega, useUpdateGestaoEntrega } from "@/hooks/useGestaoEntregas";
import { GestaoEntregaDialog } from "./GestaoEntregaDialog";

const STATUS_OPTIONS = ["Todos", "Em andamento", "Finalizado", "Atrasado", "Pausado"];

interface Props {
  entregas: GestaoEntrega[];
}

export const GestaoTabelaView = ({ entregas }: Props) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [mentorFilter, setMentorFilter] = useState("Todos");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedEntrega, setSelectedEntrega] = useState<GestaoEntrega | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const updateEntrega = useUpdateGestaoEntrega();

  const today = startOfDay(new Date());
  const nearDeadline = addDays(today, 3);

  const mentors = useMemo(() => {
    const set = new Set<string>();
    entregas.forEach((e) => {
      const m = e.mentor || e.mentorado?.mentor;
      if (m) set.add(m);
    });
    return Array.from(set);
  }, [entregas]);

  const processedEntregas = useMemo(() => {
    return entregas.map((e) => {
      const prazoDate = new Date(e.prazo + "T12:00:00");
      if (isBefore(prazoDate, today) && e.status !== "Finalizado" && e.status !== "Atrasado") {
        return { ...e, status: "Atrasado" };
      }
      return e;
    });
  }, [entregas, today]);

  const filtered = useMemo(() => {
    let result = processedEntregas;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((e) =>
        e.mentorado?.nome?.toLowerCase().includes(s) ||
        e.responsavel?.nome?.toLowerCase().includes(s)
      );
    }
    if (statusFilter !== "Todos") {
      result = result.filter((e) => e.status === statusFilter);
    }
    if (mentorFilter !== "Todos") {
      const m = mentorFilter;
      result = result.filter((e) => (e.mentor || e.mentorado?.mentor) === m);
    }
    result.sort((a, b) => {
      const cmp = a.prazo.localeCompare(b.prazo);
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [processedEntregas, search, statusFilter, mentorFilter, sortAsc]);

  const handleInlineStatusChange = (id: string, newStatus: string) => {
    updateEntrega.mutate({ id, status: newStatus });
  };

  const getRowClass = (e: GestaoEntrega) => {
    if (e.status === "Finalizado") return "opacity-50";
    const prazoDate = new Date(e.prazo + "T12:00:00");
    if (isBefore(prazoDate, today)) return "bg-red-50 dark:bg-red-950/20";
    if (isBefore(prazoDate, nearDeadline)) return "bg-yellow-50 dark:bg-yellow-950/20";
    return "";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Finalizado": return <Badge variant="secondary" className="bg-muted text-muted-foreground">Finalizado</Badge>;
      case "Atrasado": return <Badge variant="destructive">Atrasado</Badge>;
      case "Pausado": return <Badge variant="outline">Pausado</Badge>;
      default: return <Badge className="bg-primary/20 text-primary border-primary/30">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar mentorado..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={mentorFilter} onValueChange={setMentorFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Mentor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos mentores</SelectItem>
            {mentors.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={() => setSortAsc(!sortAsc)}>
          <ArrowUpDown className="h-4 w-4 mr-1" /> Prazo
        </Button>
      </div>

      <div className="flex-1 overflow-auto border rounded-lg">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-[100px]">Copy</TableHead>
              <TableHead className="w-[160px]">Cliente</TableHead>
              <TableHead className="w-[120px]">Mentor</TableHead>
              <TableHead className="w-[140px]">Plano</TableHead>
              <TableHead className="w-[80px] text-center">Leva Atual</TableHead>
              <TableHead className="w-[110px]">Prazo Atual</TableHead>
              <TableHead className="w-[80px] text-center">Levas no Total</TableHead>
              <TableHead className="w-[80px] text-center">Roteiros por Leva</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[110px]">Entregas</TableHead>
              <TableHead>Observação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow
                key={e.id}
                className={cn("cursor-pointer hover:bg-accent/50 transition-colors", getRowClass(e))}
                onClick={() => { setSelectedEntrega(e); setDialogOpen(true); }}
              >
                <TableCell className="text-sm">{e.responsavel?.nome || "—"}</TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: e.mentorado?.cor || "#3B82F6" }}
                    />
                    <span className="truncate">{e.mentorado?.nome}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{e.mentor || e.mentorado?.mentor || "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{e.mentorado?.curso || "—"}</TableCell>
                <TableCell className="text-center">{e.leva || "—"}</TableCell>
                <TableCell className="text-sm">
                  {e.prazo ? format(new Date(e.prazo + "T12:00:00"), "dd/MM/yyyy") : "—"}
                </TableCell>
                <TableCell className="text-center">{e.levas_totais || "—"}</TableCell>
                <TableCell className="text-center">{e.roteiros_por_leva || "—"}</TableCell>
                <TableCell onClick={(ev) => ev.stopPropagation()}>
                  <Select value={e.status} onValueChange={(v) => handleInlineStatusChange(e.id, v)}>
                    <SelectTrigger className="h-7 text-xs border-0 p-0 focus:ring-0">
                      <SelectValue>{getStatusBadge(e.status)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.filter((s) => s !== "Todos").map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-sm">
                  {e.data_entrega ? format(new Date(e.data_entrega + "T12:00:00"), "dd/MM/yyyy") : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">{e.observacao || "—"}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                  Nenhuma entrega encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <GestaoEntregaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entrega={selectedEntrega}
      />
    </div>
  );
};
