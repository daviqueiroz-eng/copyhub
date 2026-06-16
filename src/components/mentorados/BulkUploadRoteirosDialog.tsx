import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Sparkles, Upload, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ParsedItem {
  headline: string;
  estrutura: string;
}

interface BulkUploadRoteirosDialogProps {
  open: boolean;
  onClose: () => void;
  guiaNumero: number;
  guiaQuantidade: number;
  emptyOrdens: number[];
  onApply: (items: ParsedItem[]) => Promise<void> | void;
  onExpandSlots: (extra: number) => Promise<void> | void;
}

export function BulkUploadRoteirosDialog({
  open,
  onClose,
  guiaNumero,
  guiaQuantidade,
  emptyOrdens,
  onApply,
  onExpandSlots,
}: BulkUploadRoteirosDialogProps) {
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ParsedItem[] | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!open) {
      setTexto("");
      setItems(null);
      setLoading(false);
      setApplying(false);
    }
  }, [open]);

  const handleParse = async () => {
    if (!texto.trim()) {
      toast({ title: "Cole algum conteúdo primeiro", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-bulk-roteiros", {
        body: { texto },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const parsed: ParsedItem[] = data?.items || [];
      if (parsed.length === 0) {
        toast({ title: "Nenhum item identificado", description: "Verifique o texto colado.", variant: "destructive" });
        setLoading(false);
        return;
      }
      setItems(parsed);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao processar";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!items || items.length === 0) return;
    setApplying(true);
    try {
      const needed = items.length;
      const available = emptyOrdens.length;
      if (needed > available) {
        const extra = needed - available;
        await onExpandSlots(extra);
      }
      await onApply(items);
      toast({
        title: "Importado!",
        description: `${items.length} ${items.length === 1 ? "item adicionado" : "itens adicionados"} à Guia ${guiaNumero}.`,
      });
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao aplicar";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setApplying(false);
    }
  };

  const willExpand = items ? Math.max(0, items.length - emptyOrdens.length) : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" style={{ color: "#B8860B" }} />
            Subir em massa — Guia {guiaNumero}
          </DialogTitle>
          <DialogDescription>
            Cole headlines (e roteiros, se tiver) em qualquer formato. A IA identifica e separa automaticamente.
            Preenche apenas slots vazios — nada existente será sobrescrito.
          </DialogDescription>
        </DialogHeader>

        {!items ? (
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            <Textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={`Cole aqui... aceita qualquer formato:\n\n- Lista numerada (1. ... 2. ...)\n- Linhas separadas\n- Headlines + roteiros juntos\n- Blocos separados por --- ou linha em branco`}
              className="flex-1 min-h-[300px] resize-none font-mono text-sm"
              autoFocus
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {emptyOrdens.length} slot(s) vazio(s) disponível(eis) na Guia {guiaNumero} ({guiaQuantidade} no total)
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
                <Button onClick={handleParse} disabled={loading || !texto.trim()} className="gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loading ? "Identificando..." : "Identificar com IA"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                <strong>{items.length}</strong> {items.length === 1 ? "item identificado" : "itens identificados"}
                {willExpand > 0 && (
                  <span className="text-amber-600 dark:text-amber-400 ml-2">
                    (a guia será expandida em +{willExpand} slot{willExpand > 1 ? "s" : ""})
                  </span>
                )}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setItems(null)} disabled={applying} className="gap-1">
                <ArrowLeft className="h-3 w-3" /> Voltar e editar
              </Button>
            </div>
            <ScrollArea className="flex-1 border rounded-md p-3">
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={i} className="border-l-2 pl-3" style={{ borderColor: "#B8860B" }}>
                    <div className="text-xs font-semibold mb-1" style={{ color: "#B8860B" }}>
                      HEADLINE #{i + 1}
                    </div>
                    <div className="text-sm font-medium mb-2 whitespace-pre-wrap">{item.headline}</div>
                    {item.estrutura && (
                      <>
                        <div className="text-xs font-semibold mb-1" style={{ color: "#B8860B" }}>
                          ESTRUTURA
                        </div>
                        <div className="text-sm whitespace-pre-wrap text-muted-foreground">{item.estrutura}</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose} disabled={applying}>Cancelar</Button>
              <Button onClick={handleApply} disabled={applying} className="gap-2">
                {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {applying ? "Aplicando..." : `Adicionar à Guia ${guiaNumero}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}