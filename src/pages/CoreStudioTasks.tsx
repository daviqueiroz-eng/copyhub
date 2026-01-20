const CoreStudioTasks = () => {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="border-b bg-background p-4">
        <h1 className="text-2xl font-bold text-foreground">Core Manager</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerenciador de Tarefas
        </p>
      </div>
      <div className="flex-1 relative">
        <iframe
          src="https://manager.corestudio.ai/tasks"
          className="absolute inset-0 w-full h-full border-0"
          title="Core Manager"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default CoreStudioTasks;
