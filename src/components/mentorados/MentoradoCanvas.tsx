import { useEffect, useRef, useCallback } from "react";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { useUpdateMentorado } from "@/hooks/useMentorados";
import { useToast } from "@/hooks/use-toast";

interface MentoradoCanvasProps {
  mentoradoId: string;
  initialData: any | null;
}

export const MentoradoCanvas = ({ mentoradoId, initialData }: MentoradoCanvasProps) => {
  const updateMentorado = useUpdateMentorado();
  const { toast } = useToast();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<any>(null);

  const handleSave = useCallback((snapshot: any) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      updateMentorado.mutate(
        {
          id: mentoradoId,
          canvas_data: snapshot,
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
    }, 1500); // Debounce de 1.5s
  }, [mentoradoId, updateMentorado, toast]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full h-[calc(100vh-280px)] border border-border rounded-lg overflow-hidden">
      <Tldraw
        snapshot={initialData}
        onMount={(editor) => {
          editorRef.current = editor;
          
          // Auto-save quando houver mudanças
          editor.store.listen(() => {
            const snapshot = editor.store.serialize('document');
            handleSave(snapshot);
          }, { scope: 'all' });
        }}
      />
    </div>
  );
};
