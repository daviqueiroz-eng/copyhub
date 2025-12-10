import { useComunicados } from "@/hooks/useMural";
import { ComunicadoFormDialog } from "@/components/mural/ComunicadoFormDialog";
import { ComunicadoCard } from "@/components/mural/ComunicadoCard";
import { useUserRole } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AtualizacoesManager } from "@/components/admin/AtualizacoesManager";
import { MessageSquare, Megaphone } from "lucide-react";

const Mural = () => {
  const { data: comunicados, isLoading } = useComunicados();
  const { data: role } = useUserRole();

  const isAdmin = role === "admin";

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Mural</h2>
        <p className="text-muted-foreground mt-1">
          Central de comunicados e alinhamentos da equipe
        </p>
      </div>

      <Tabs defaultValue="comunicados" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="comunicados" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Comunicados
          </TabsTrigger>
          <TabsTrigger value="atualizacoes" className="gap-2">
            <Megaphone className="h-4 w-4" />
            Atualizações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comunicados" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Comunicados da Equipe</h3>
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
        </TabsContent>

        <TabsContent value="atualizacoes" className="mt-6">
          <AtualizacoesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Mural;
