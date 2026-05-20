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
  Pencil,
  Trash2,
} from "lucide-react";

type Roteiro = {
  ordem: number;
  headline: string | null;
  estrutura: string | null;
  headline_audio_url?: string | null;
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
const MEUS_KEY_PREFIX = "roteiro-publico-meus-";

const lerMeusIds = (token: string): string[] => {
  try {
    return JSON.parse(localStorage.getItem(MEUS_KEY_PREFIX + token) || "[]");
  } catch {
    return [];
  }
};
const salvarMeuId = (token: string, id: string) => {
  const atual = lerMeusIds(token);
  if (!atual.includes(id)) {
    localStorage.setItem(MEUS_KEY_PREFIX + token, JSON.stringify([...atual, id]));
  }
};
const removerMeuIdLocal = (token: string, id: string) => {
  const atual = lerMeusIds(token).filter((x) => x !== id);
  localStorage.setItem(MEUS_KEY_PREFIX + token, JSON.stringify(atual));
};

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
  const mimeRef = useRef<string>("audio/webm");
  const [enviando, setEnviando] = useState(false);

  // Waveform
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // Comentários do visitante
  const [meusIds, setMeusIds] = useState<string[]>([]);
  useEffect(() => {
    if (token) setMeusIds(lerMeusIds(token));
  }, [token]);

  // Edição inline
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editTexto, setEditTexto] = useState("");

  // Carrega dados
  const carregar = async () => {
    if (!token) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("get_roteiro_publico_v2", {
      _slug_or_token: token,
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
      const candidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4;codecs=mp4a.40.2",
        "audio/mp4",
        "audio/aac",
      ];
      const mime =
        candidates.find((c) =>
          typeof MediaRecorder !== "undefined" &&
          (MediaRecorder as unknown as { isTypeSupported?: (t: string) => boolean })
            .isTypeSupported?.(c)
        ) || "";
      mimeRef.current = mime || "audio/webm";
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeRef.current });
        setAudioBlob(blob);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
        pararWaveform();
      };
      mr.start(250);
      setGravando(true);
      iniciarWaveform(stream);
    } catch (e) {
      toast({ title: "Não foi possível acessar o microfone", variant: "destructive" });
    }
  };

  const pararGravacao = () => {
    mediaRef.current?.stop();
    setGravando(false);
  };

  const iniciarWaveform = (stream: MediaStream) => {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const draw = () => {
        if (!analyserRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas) {
          // canvas ainda não montou — tenta no próximo frame
          rafRef.current = requestAnimationFrame(draw);
          return;
        }
        const c = canvas.getContext("2d");
        if (!c) return;
        analyserRef.current.getByteTimeDomainData(data);
        const w = canvas.width;
        const h = canvas.height;
        c.clearRect(0, 0, w, h);
        c.lineWidth = 2;
        c.strokeStyle = "#B8860B";
        c.beginPath();
        const slice = w / data.length;
        for (let i = 0; i < data.length; i++) {
          const v = data[i] / 128.0;
          const y = (v * h) / 2;
          const x = i * slice;
          if (i === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
        }
        c.stroke();
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();
    } catch {
      // ignore
    }
  };

  const pararWaveform = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  };

  useEffect(() => () => pararWaveform(), []);

  const salvarEdicao = async (id: string) => {
    if (!token) return;
    const v = editTexto.trim();
    if (!v) {
      toast({ title: "Escreva algo", variant: "destructive" });
      return;
    }
    const { error } = await supabase.rpc("atualizar_comentario_publico", {
      _slug_or_token: token,
      _comentario_id: id,
      _conteudo_texto: v,
    });
    if (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
      return;
    }
    toast({ title: "Comentário atualizado!" });
    setEditandoId(null);
    setEditTexto("");
    carregar();
  };

  const excluirMeuComentario = async (id: string) => {
    if (!token) return;
    const { error } = await supabase.rpc("excluir_comentario_publico", {
      _slug_or_token: token,
      _comentario_id: id,
    });
    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
      return;
    }
    removerMeuIdLocal(token, id);
    setMeusIds(lerMeusIds(token));
    toast({ title: "Comentário excluído" });
    carregar();
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
        const mime = mimeRef.current || audioBlob.type || "audio/webm";
        const ext = mime.includes("mp4") ? "mp4" : mime.includes("aac") ? "aac" : "webm";
        const fileName = `${token}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("roteiro-comentarios-audio")
          .upload(fileName, audioBlob, { contentType: mime });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage
          .from("roteiro-comentarios-audio")
          .getPublicUrl(fileName);
        audioUrl = pub.publicUrl;
      }
      const { data: novoId, error } = await supabase.rpc("inserir_comentario_publico_v2", {
        _slug_or_token: token,
        _ordem: contexto.ordem,
        _escopo: contexto.escopo,
        _trecho_texto: contexto.trecho ?? null,
        _autor_nome: nomeTrim,
        _conteudo_texto: texto.trim() || null,
        _audio_url: audioUrl,
      });
      if (error) throw error;
      if (novoId && token) {
        salvarMeuId(token, novoId as unknown as string);
        setMeusIds(lerMeusIds(token));
      }
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
        (c) =>
          meusIds.includes(c.id) ||
          (nome.trim() &&
            c.autor_nome.trim().toLowerCase() === nome.trim().toLowerCase())
      ) ?? [],
    [dados, nome, meusIds]
  );

  const podeEditar = (id: string) => meusIds.includes(id);

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
                    {editandoId === c.id ? (
                      <div className="space-y-1 mt-1">
                        <Textarea
                          value={editTexto}
                          onChange={(e) => setEditTexto(e.target.value)}
                          rows={3}
                          className="text-xs"
                        />
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[10px]"
                            onClick={() => {
                              setEditandoId(null);
                              setEditTexto("");
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            className="h-6 px-2 text-[10px]"
                            onClick={() => salvarEdicao(c.id)}
                          >
                            Salvar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      c.conteudo_texto && (
                        <p className="whitespace-pre-wrap mt-1">{c.conteudo_texto}</p>
                      )
                    )}
                    {c.audio_url && (
                      <audio controls src={c.audio_url} className="w-full mt-1 h-8" />
                    )}
                    {podeEditar(c.id) && editandoId !== c.id && (
                      <div className="flex justify-end gap-1 mt-1">
                        {c.conteudo_texto && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[10px]"
                            onClick={() => {
                              setEditandoId(c.id);
                              setEditTexto(c.conteudo_texto ?? "");
                            }}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[10px] text-destructive"
                          onClick={() => excluirMeuComentario(c.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
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
                <div className="flex items-center gap-2 flex-1">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={pararGravacao}
                    className="gap-1"
                  >
                    <Square className="h-4 w-4" />
                    Parar
                  </Button>
                  <canvas
                    ref={canvasRef}
                    width={220}
                    height={32}
                    className="flex-1 rounded bg-muted"
                  />
                </div>
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
