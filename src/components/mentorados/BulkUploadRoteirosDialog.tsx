import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, ArrowLeft, Wand2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ParsedItem {
  headline: string;
  estrutura: string;
  link_referencia?: string | null;
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

// === Parser determinístico (sem IA) ===
// Regras:
// - Divide o texto em blocos por linha em branco ou separador (--- / ===).
// - Em cada bloco: a primeira linha (após remover numeração/rótulos) vira a HEADLINE.
//   As linhas seguintes (se houver), preservadas como estão, viram a ESTRUTURA.
// - Remove apenas marcadores no início da linha (1. / 1) / - / • / Headline: / Roteiro: / Estrutura:).
// - NÃO reescreve, NÃO corrige, NÃO inventa conteúdo.
const LABEL_HEADLINE = /^\s*(headline|t[íi]tulo|hook|gancho)\s*[:\-—]\s*/i;
const LABEL_ESTRUTURA = /^\s*(estrutura|roteiro|corpo|desenvolvimento|script)\s*[:\-—]\s*/i;
const NUMBERING = /^\s*(?:\d{1,3}[.)\-:]|[-•·*+])\s+/;
const SEPARATOR_LINE = /^\s*[-=_*]{3,}\s*$/;
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function stripLeading(line: string): string {
  let out = line.replace(NUMBERING, "");
  out = out.replace(LABEL_HEADLINE, "");
  return out.trim();
}

function stripEstruturaLabel(line: string): string {
  return line.replace(LABEL_ESTRUTURA, "");
}

function parseBulkText(raw: string): ParsedItem[] {
  if (!raw || !raw.trim()) return [];

  // Normaliza quebras de linha
  const text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Divide em blocos: linha em branco (uma ou mais) OU linha de separador
  const lines = text.split("\n");
  const blocks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (line.trim() === "" || SEPARATOR_LINE.test(line)) {
      if (current.length > 0) {
        blocks.push(current);
        current = [];
      }
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) blocks.push(current);

  const items: ParsedItem[] = [];
  for (const block of blocks) {
    // Remove linhas totalmente vazias do começo/fim
    while (block.length && !block[0].trim()) block.shift();
    while (block.length && !block[block.length - 1].trim()) block.pop();
    if (block.length === 0) continue;

    // Coleta TODAS as URLs do bloco — viram referências
    const allUrls: string[] = [];
    const linesSemUrl = block.map((ln) => {
      const found = ln.match(URL_REGEX);
      if (found) allUrls.push(...found);
      return ln.replace(URL_REGEX, "").replace(/\s{2,}/g, " ").trim();
    }).filter((ln) => ln.length > 0);

    if (linesSemUrl.length === 0 && allUrls.length === 0) continue;

    const headline = linesSemUrl.length > 0 ? stripLeading(linesSemUrl[0]) : "";
    if (!headline && allUrls.length === 0) continue;

    const restLines = linesSemUrl.slice(1);
    if (restLines.length > 0) {
      restLines[0] = stripEstruturaLabel(restLines[0]);
    }
    const estrutura = restLines.join("\n").trim();

    if (allUrls.length <= 1) {
      items.push({ headline, estrutura, link_referencia: allUrls[0] || null });
    } else {
      // Mais de 1 link → duplica a headline, uma entrada por link
      for (const url of allUrls) {
        items.push({ headline, estrutura, link_referencia: url });
      }
    }
  }

  return items;
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
  const [items, setItems] = useState<ParsedItem[] | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!open) {
      setTexto("");
      setItems(null);
      setApplying(false);
    }
  }, [open]);

  const handleParse = () => {
    if (!texto.trim()) {
      toast({ title: "Cole algum conteúdo primeiro", variant: "destructive" });
      return;
    }
    const parsed = parseBulkText(texto);
    if (parsed.length === 0) {
      toast({
        title: "Nenhum item identificado",
        description: "Separe cada headline por uma linha em branco ou ---",
        variant: "destructive",
      });
      return;
    }
    setItems(parsed);
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
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col gap-3">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" style={{ color: "#B8860B" }} />
            Subir em massa — Guia {guiaNumero}
          </DialogTitle>
          <DialogDescription>
            Separe cada headline por <strong>linha em branco</strong> ou por <strong>---</strong>.
            A 1ª linha vira a headline; as próximas viram a estrutura (se houver).
            Preenche apenas slots vazios — nada será sobrescrito.
          </DialogDescription>
        </DialogHeader>

        {!items ? (
          <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
            <Textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={`Cole aqui. Exemplos aceitos:\n\nHeadline 1\n\nHeadline 2\n\n---\n\nHeadline com roteiro\nPrimeira linha do roteiro\nSegunda linha do roteiro...\n\n---\n\n1. Outra headline\n2. Outra headline`}
              className="flex-1 min-h-0 resize-none font-mono text-sm"
              autoFocus
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {emptyOrdens.length} slot(s) vazio(s) disponível(eis) na Guia {guiaNumero} ({guiaQuantidade} no total)
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleParse} disabled={!texto.trim()} className="gap-2">
                  <Wand2 className="h-4 w-4" />
                  Identificar
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
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
            <div className="flex-1 min-h-0 overflow-y-auto border rounded-md p-3">
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
            </div>
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