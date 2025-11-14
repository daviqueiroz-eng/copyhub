import { useEffect } from "react";
import { PomodoroTimer } from "@/components/flow/PomodoroTimer";
import { NotasQuick } from "@/components/flow/NotasQuick";
import { KanbanBoard } from "@/components/flow/KanbanBoard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, StickyNote, KanbanSquare } from "lucide-react";

const ModoFlow = () => {
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🎯 Modo Flow</h1>
          <p className="text-muted-foreground">
            Central de produtividade: Pomodoro, Notas e Tarefas
          </p>
        </div>
      </div>

      <Tabs defaultValue="pomodoro" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
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
      </Tabs>
    </div>
  );
};

export default ModoFlow;
