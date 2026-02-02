import { useEffect } from "react";
import { PomodoroTimer } from "@/components/flow/PomodoroTimer";
import { NotasQuick } from "@/components/flow/NotasQuick";
import { KanbanBoard } from "@/components/flow/KanbanBoard";
import { AtividadesGerais } from "@/components/flow/AtividadesGerais";
import { SprintsBoard } from "@/components/flow/SprintsBoard";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, StickyNote, KanbanSquare, Megaphone, Target } from "lucide-react";

const Atividades = () => {
  const { user } = useAuth();

  const { data: isAdmin } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();
      return !!data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📋 Atividades</h1>
          <p className="text-muted-foreground">
            Central de produtividade: Pomodoro, Notas, Tarefas e Atividades Gerais
          </p>
        </div>
      </div>

      <Tabs defaultValue="pomodoro" className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-5">
          <TabsTrigger value="pomodoro">
            <Clock className="mr-2 h-4 w-4" />
            Pomodoro
          </TabsTrigger>
          <TabsTrigger value="notas">
            <StickyNote className="mr-2 h-4 w-4" />
            Notas
          </TabsTrigger>
          <TabsTrigger value="kanban">
            <KanbanSquare className="mr-2 h-4 w-4" />
            Tarefas
          </TabsTrigger>
          <TabsTrigger value="atividades-gerais">
            <Megaphone className="mr-2 h-4 w-4" />
            Atividades Gerais
          </TabsTrigger>
          <TabsTrigger value="sprints">
            <Target className="mr-2 h-4 w-4" />
            Sprints
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pomodoro" className="mt-6">
          <PomodoroTimer />
        </TabsContent>

        <TabsContent value="notas" className="mt-6">
          <NotasQuick />
        </TabsContent>

        <TabsContent value="kanban" className="mt-6">
          <KanbanBoard />
        </TabsContent>

        <TabsContent value="atividades-gerais" className="mt-6">
          <AtividadesGerais />
        </TabsContent>

        <TabsContent value="sprints" className="mt-6">
          <SprintsBoard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Atividades;
