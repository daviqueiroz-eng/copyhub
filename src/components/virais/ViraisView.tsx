import { useState } from "react";
import { Flame, Plus, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useVirais, ViralFilters } from "@/hooks/useVirais";
import { ViraisFiltersBar } from "./ViraisFilters";
import { ViraisTable } from "./ViraisTable";
import { ViralRegistrarDialog } from "./ViralRegistrarDialog";

export const ViraisView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasFrom = Boolean((location.state as { from?: string } | null)?.from);
  const [filters, setFilters] = useState<ViralFilters>({
    nichoIds: [],
    formatos: [],
    meusVirais: false,
    orderBy: "recentes",
  });
  const [openRegister, setOpenRegister] = useState(false);

  const { data: virais = [], isLoading } = useVirais(filters);

  return (
    <div
      className="p-6 max-w-[1400px] mx-auto"
      style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          {hasFrom && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              title="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Virais</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie e acompanhe os conteúdos virais do sistema
            </p>
          </div>
        </div>
        <Button onClick={() => setOpenRegister(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Registrar novo viral
        </Button>
      </div>

      <div className="mb-4">
        <ViraisFiltersBar filters={filters} onChange={setFilters} />
      </div>

      <ViraisTable virais={virais} loading={isLoading} />

      <ViralRegistrarDialog
        open={openRegister}
        onOpenChange={setOpenRegister}
      />
    </div>
  );
};