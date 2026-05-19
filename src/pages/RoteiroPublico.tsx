import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Mic,
  Square,
  Send,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
} from "lucide-react";

type Roteiro = {
  ordem: number;
  headline: string | null;
  estrutura: string | null;
  link_referencia: string | null;
};

type Comentario = {
  id: string;
  ordem: number;
  escopo: "headline" | "estrutura" | "selecao";
  trecho_texto: string | null;
  autor_nome: string;
  conteudo_texto: string | null;
  audio_url: string | null;
  created_at: string;
};

type Dados = {
  share_id: string;
  mentorado_nome: string;
  guia_numero: number;
  guia_nome: string | null;
  roteiros: Roteiro[];
  comentarios: Comentario[];
  error?: string;
};

const NOME_KEY_PREFIX = "roteiro-publico-nome-";

const RoteiroPublico = () => {
  const { token } = useParams<{ token: string }>();
  const [dados, setDados] = useState<Dados | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [painelAberto, setPainelAberto] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [contexto, setContexto] = useState<{
    ordem: number;
    escopo: "headline" | "estrutura" | "selecao";
    trecho?: string;
  } | null>(null);
  const [texto, setTexto] = useState("");
  const [gravando, setGravando] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [enviando, setEnviando] = useState(false);

  // Carrega dados
  const carregar = async () => {
    if (!token) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("get_roteiro_publico", {
      _token: token,
    });
    if (error) {
      setErro("Erro ao carregar.");
    } else {
      const d = data as unknown as Dados;
      if (d?.error) {
        setErro("Link inválido ou desativado.");
      } else {
        setDados(d);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    carregar();
    // realtime: novos comentários
    if (!token) return;
    const ch = supabase
      .channel(`pub-coments-${token}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "roteiro_comentarios" },
        () => carregar()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Nome salvo
  useEffect(() => {
    if (!token) return;
    const saved = localStorage.getItem(NOME_KEY_PREFIX + token);
    if (saved) setNome(saved);
  }, [token]);

  // Seleção de texto -> popover flutuante
  const [selecao, setSelecao] = useState<{
    ordem: number;
    trecho: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const handler = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setSelecao(null);
        return;
      }
      const trecho = sel.toString().trim();
      if (!trecho) {
        setSelecao(null);
        return;
      }
      const anchor = sel.anchorNode?.parentElement?.closest("[data-bloco-ordem]") as
        | HTMLElement
        | null;
      if (!anchor) {
        setSelecao(null);
        return;
      }
      const ordem = Number(anchor.dataset.blocoOrdem);
      const range = sel.getRangeAt(0).getBoundingClientRect();
      setSelecao({
        ordem,
        trecho,
        x: range.left + range.width / 2 + window.scrollX,
        y: range.top + window.scrollY - 8,
      });
    };
    document.addEventListener("mouseup", handler);
    document.addEventListener("touchend", handler);
    return () => {
      document.removeEventListener("mouseup", handler);
      document.removeEventListener("touchend", handler);
    };
  }, []);

  const abrirDialog = (
    ordem: number,
    escopo: "headline" | "estrutura" | "selecao",
    trecho?: string
  ) => {
    setContexto({ ordem, escopo, trecho });
    setTexto("");
    setAudioBlob(null);
    setAudioPreviewUrl(null);
    setDialogOpen(true);
    setSelecao(null);
  };

  const iniciarGravacao = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      setGravando(true);
    } catch (e) {
      toast({ title: "Não foi possível acessar o microfone", variant: "destructive" });
    }
  };

  const pararGravacao = () => {
    mediaRef.current?.stop();
    setGravando(false);
  };

  const enviar = async () => {
    if (!token || !contexto) return;
    const nomeTrim = nome.trim();
    if (!nomeTrim) {
      toast({ title: "Digite seu nome para comentar", variant: "destructive" });
      return;
    }
    if (!texto.trim() && !audioBlob) {
      toast({ title: "Escreva ou grave algo", variant: "destructive" });
      return;
    }
    setEnviando(true);
    try {
      localStorage.setItem(NOME_KEY_PREFIX + token, nomeTrim);
      let audioUrl: string | null = null;
      if (audioBlob) {
        const fileName = `${token}/${Date.now()}.webm`;
        const { error: upErr } = await supabase.storage
          .from("roteiro-comentarios-audio")
          .upload(fileName, audioBlob, { contentType: "audio/webm" });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage
          .from("roteiro-comentarios-audio")
          .getPublicUrl(fileName);
        audioUrl = pub.publicUrl;
      }
      const { error } = await supabase.rpc("inserir_comentario_publico", {
        _token: token,
        _ordem: contexto.ordem,
        _escopo: contexto.escopo,
        _trecho_texto: contexto.trecho ?? null,
        _autor_nome: nomeTrim,
        _conteudo_texto: texto.trim() || null,
        _audio_url: audioUrl,
      });
      if (error) throw error;
      toast({ title: "Comentário enviado!" });
      setDialogOpen(false);
      setTexto("");
      setAudioBlob(null);
      setAudioPreviewUrl(null);
      carregar();
    } catch (e: unknown) {
      console.error(e);
      toast({ title: "Erro ao enviar comentário", variant: "destructive" });
    } finally {
      setEnviando(false);
    }
  };

  const meusComentarios = useMemo(
    () =>
      dados?.comentarios.filter(
        (c) => c.autor_nome.trim().toLowerCase() === nome.trim().toLowerCase()
      ) ?? [],
    [dados, nome]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (erro || !dados) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">{erro ?? "Não encontrado"}</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background"
      style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
    >
      <div className="flex">
        {/* Painel lateral esquerdo */}
        {painelAberto && (
          <aside className="hidden md:flex flex-col border-r bg-background w-72 sticky top-0 h-screen">
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" style={{ color: "#B8860B" }} />
                <p className="font-semibold text-sm">Meus comentários</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPainelAberto(false)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-3 border-b">
              <label className="text-xs text-muted-foreground">Seu nome</label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onBlur={() =>
                  token && localStorage.setItem(NOME_KEY_PREFIX + token, nome.trim())
                }
                placeholder="Digite seu nome"
                className="mt-1 h-8 text-sm"
              />
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {meusComentarios.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Você ainda não comentou.
                  </p>
                )}
                {meusComentarios.map((c) => (
                  <div key={c.id} className="rounded-md border p-2 text-xs">
                    <p className="font-semibold" style={{ color: "#B8860B" }}>
                      {c.escopo === "headline"
                        ? `Headline ${String(c.ordem).padStart(2, "0")}`
                        : c.escopo === "estrutura"
                        ? `Estrutura ${String(c.ordem).padStart(2, "0")}`
                        : `Trecho — bloco ${String(c.ordem).padStart(2, "0")}`}
                    </p>
                    {c.trecho_texto && (
                      <p className="italic text-[11px] border-l-2 pl-2 my-1 text-muted-foreground">
                        "{c.trecho_texto}"
                      </p>
                    )}
                    {c.conteudo_texto && (
                      <p className="whitespace-pre-wrap mt-1">{c.conteudo_texto}</p>
                    )}
                    {c.audio_url && (
                      <audio controls src={c.audio_url} className="w-full mt-1 h-8" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </aside>
        )}

        {/* Conteúdo principal */}
        <main className="flex-1 min-w-0">
          {!painelAberto && (
            <Button
              variant="outline"
              size="sm"
              className="m-3 gap-2"
              onClick={() => setPainelAberto(true)}
            >
              <ChevronRight className="h-4 w-4" />
              Meus comentários
            </Button>
          )}
          <div className="max-w-2xl mx-auto px-6 py-10">
            <header className="mb-8">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {dados.mentorado_nome}
              </p>
              <h1 className="text-2xl font-semibold">
                {dados.guia_nome || `Guia ${dados.guia_numero}`}
              </h1>
            </header>

            <div className="space-y-10">
              {dados.roteiros.map((r) => {
                const headline = (r.headline ?? "").trim();
                const estrutura = (r.estrutura ?? "").trim();
                if (!headline && !estrutura) return null;
                return (
                  <section key={r.ordem} className="group">
                    {headline && (
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <p
                            className="text-xs font-bold tracking-wide"
                            style={{ color: "#B8860B" }}
                          >
                            HEADLINE {String(r.ordem).padStart(2, "0")}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 opacity-0 group-hover:opacity-100 transition-opacity gap-1 text-xs"
                            onClick={() => abrirDialog(r.ordem, "headline")}
                          >
                            <MessageSquare className="h-3 w-3" />
                            Comentar
                          </Button>
                        </div>
                        <p
                          data-bloco-ordem={r.ordem}
                          className="whitespace-pre-wrap leading-relaxed select-text"
                        >
                          {headline}
                        </p>
                        {r.link_referencia && (
                          <a
                            href={r.link_referencia}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline mt-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Referência
                          </a>
                        )}
                      </div>
                    )}
                    {estrutura && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p
                            className="text-xs font-bold tracking-wide"
                            style={{ color: "#B8860B" }}
                          >
                            ESTRUTURA {String(r.ordem).padStart(2, "0")}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 opacity-0 group-hover:opacity-100 transition-opacity gap-1 text-xs"
                            onClick={() => abrirDialog(r.ordem, "estrutura")}
                          >
                            <MessageSquare className="h-3 w-3" />
                            Comentar
                          </Button>
                        </div>
                        <p
                          data-bloco-ordem={r.ordem}
                          className="whitespace-pre-wrap leading-relaxed select-text"
                        >
                          {estrutura}
                        </p>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {/* Popover flutuante de seleção */}
      {selecao && (
        <div
          className="fixed z-50 -translate-x-1/2 -translate-y-full"
          style={{ left: selecao.x, top: selecao.y }}
        >
          <Button
            size="sm"
            className="gap-1 shadow-lg"
            onClick={() =>
              abrirDialog(selecao.ordem, "selecao", selecao.trecho)
            }
          >
            <MessageSquare className="h-3 w-3" />
            Comentar trecho
          </Button>
        </div>
      )}

      {/* Dialog de envio */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="sm:max-w-md"
          style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
        >
          <DialogHeader>
            <DialogTitle>
              {contexto?.escopo === "selecao"
                ? "Comentar trecho selecionado"
                : contexto?.escopo === "headline"
                ? `Comentar Headline ${String(contexto?.ordem ?? 0).padStart(2, "0")}`
                : `Comentar Estrutura ${String(contexto?.ordem ?? 0).padStart(2, "0")}`}
            </DialogTitle>
          </DialogHeader>
          {contexto?.trecho && (
            <p className="italic text-xs border-l-2 pl-2 text-muted-foreground">
              "{contexto.trecho}"
            </p>
          )}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Seu nome</label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite seu nome"
                className="mt-1"
              />
            </div>
            <Textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escreva seu comentário..."
              rows={4}
            />
            <div className="flex items-center gap-2">
              {!gravando && !audioBlob && (
                <Button variant="outline" size="sm" onClick={iniciarGravacao} className="gap-1">
                  <Mic className="h-4 w-4" />
                  Gravar áudio
                </Button>
              )}
              {gravando && (
                <Button variant="destructive" size="sm" onClick={pararGravacao} className="gap-1">
                  <Square className="h-4 w-4" />
                  Parar
                </Button>
              )}
              {audioPreviewUrl && !gravando && (
                <div className="flex items-center gap-2 flex-1">
                  <audio controls src={audioPreviewUrl} className="h-8 flex-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setAudioBlob(null);
                      setAudioPreviewUrl(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={enviar} disabled={enviando} className="gap-1">
              <Send className="h-4 w-4" />
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoteiroPublico;
