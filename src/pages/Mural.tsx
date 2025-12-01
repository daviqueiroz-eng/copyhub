import { useComunicados } from "@/hooks/useMural";
import { ComunicadoFormDialog } from "@/components/mural/ComunicadoFormDialog";
import { ComunicadoCard } from "@/components/mural/ComunicadoCard";
import { useUserRole } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

const Mural = () => {
  const { data: comunicados, isLoading } = useComunicados();
  const { data: role } = useUserRole();

  const isAdmin = role === "admin";

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Mural</h2>
          <p className="text-muted-foreground mt-1">
            Central de comunicados e alinhamentos da equipe
          </p>
        </div>
        {isAdmin && <ComunicadoFormDialog />}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </>
        ) : comunicados && comunicados.length > 0 ? (
          comunicados.map((comunicado) => (
            <ComunicadoCard key={comunicado.id} comunicado={comunicado} />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum comunicado ainda. {isAdmin && "Crie o primeiro!"}
          </div>
        )}
      </div>
    </div>
  );
};

export default Mural;
