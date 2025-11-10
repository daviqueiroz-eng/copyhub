import { useEffect, useRef, useCallback, useState } from "react";
import { Canvas as FabricCanvas, PencilBrush, Rect, Circle, Textbox, FabricObject } from "fabric";
import { useUpdateMentorado } from "@/hooks/useMentorados";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Pencil, Square, Circle as CircleIcon, Type, Trash2, Download } from "lucide-react";

interface MentoradoCanvasProps {
  mentoradoId: string;
  initialData: any | null;
}

export const MentoradoCanvas = ({ mentoradoId, initialData }: MentoradoCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const updateMentorado = useUpdateMentorado();
  const { toast } = useToast();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activeTool, setActiveTool] = useState<"select" | "draw" | "rectangle" | "circle" | "text">("select");

  const handleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (!fabricCanvasRef.current) return;
      
      const json = fabricCanvasRef.current.toJSON();
      updateMentorado.mutate(
        {
          id: mentoradoId,
          canvas_data: json,
        },
        {
          onError: () => {
            toast({
              title: "Erro ao salvar",
              description: "Não foi possível salvar as alterações do canvas.",
              variant: "destructive",
            });
          },
        }
      );
    }, 1500);
  }, [mentoradoId, updateMentorado, toast]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 1200,
      height: 600,
      backgroundColor: "#ffffff",
    });

    fabricCanvasRef.current = canvas;

    // Carregar dados salvos
    if (initialData) {
      canvas.loadFromJSON(initialData, () => {
        canvas.renderAll();
      });
    }

    // Auto-save em mudanças
    canvas.on("object:added", handleSave);
    canvas.on("object:modified", handleSave);
    canvas.on("object:removed", handleSave);

    return () => {
      canvas.dispose();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [initialData, handleSave]);

  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    canvas.isDrawingMode = activeTool === "draw";
    
    if (activeTool === "draw") {
      const brush = new PencilBrush(canvas);
      brush.color = "hsl(var(--primary))";
      brush.width = 2;
      canvas.freeDrawingBrush = brush;
    }
  }, [activeTool]);

  const handleToolClick = (tool: typeof activeTool) => {
    setActiveTool(tool);
    if (!fabricCanvasRef.current) return;

    if (tool === "rectangle") {
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: "hsl(var(--primary) / 0.2)",
        stroke: "hsl(var(--primary))",
        strokeWidth: 2,
        width: 150,
        height: 100,
      });
      fabricCanvasRef.current.add(rect);
    } else if (tool === "circle") {
      const circle = new Circle({
        left: 100,
        top: 100,
        fill: "hsl(var(--primary) / 0.2)",
        stroke: "hsl(var(--primary))",
        strokeWidth: 2,
        radius: 50,
      });
      fabricCanvasRef.current.add(circle);
    } else if (tool === "text") {
      const text = new Textbox("Digite aqui...", {
        left: 100,
        top: 100,
        fill: "hsl(var(--foreground))",
        fontSize: 20,
        width: 200,
      });
      fabricCanvasRef.current.add(text);
    }
  };

  const handleClear = () => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.clear();
    fabricCanvasRef.current.backgroundColor = "#ffffff";
    fabricCanvasRef.current.renderAll();
    handleSave();
    toast({ title: "Canvas limpo!" });
  };

  const handleDelete = () => {
    if (!fabricCanvasRef.current) return;
    const activeObjects = fabricCanvasRef.current.getActiveObjects();
    if (activeObjects.length) {
      fabricCanvasRef.current.remove(...activeObjects);
      fabricCanvasRef.current.discardActiveObject();
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleExport = () => {
    if (!fabricCanvasRef.current) return;
    const dataURL = fabricCanvasRef.current.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 1,
    });
    const link = document.createElement("a");
    link.download = `canvas-${mentoradoId}.png`;
    link.href = dataURL;
    link.click();
    toast({ title: "Canvas exportado!" });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={activeTool === "select" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTool("select")}
        >
          Selecionar
        </Button>
        <Button
          variant={activeTool === "draw" ? "default" : "outline"}
          size="sm"
          onClick={() => handleToolClick("draw")}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Desenhar
        </Button>
        <Button
          variant={activeTool === "rectangle" ? "default" : "outline"}
          size="sm"
          onClick={() => handleToolClick("rectangle")}
        >
          <Square className="h-4 w-4 mr-2" />
          Retângulo
        </Button>
        <Button
          variant={activeTool === "circle" ? "default" : "outline"}
          size="sm"
          onClick={() => handleToolClick("circle")}
        >
          <CircleIcon className="h-4 w-4 mr-2" />
          Círculo
        </Button>
        <Button
          variant={activeTool === "text" ? "default" : "outline"}
          size="sm"
          onClick={() => handleToolClick("text")}
        >
          <Type className="h-4 w-4 mr-2" />
          Texto
        </Button>
        <Button variant="outline" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Deletar
        </Button>
        <Button variant="outline" size="sm" onClick={handleClear}>
          Limpar
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>
      
      <div className="border border-border rounded-lg overflow-hidden bg-white">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};
