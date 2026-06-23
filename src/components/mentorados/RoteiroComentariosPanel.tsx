import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, X, Check, Archive, Mic, Square, Send, Reply, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  useRoteiroComentarios,
  useMarcarComentarioResolvido,
  useDeletarComentario,
  useCriarComentarioInterno,
  type RoteiroComentario,
} from "@/hooks/useRoteiroComentarios";
import { AudioPlayer } from "./AudioPlayer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export const RoteiroComentariosPanel = ({
  mentoradoId,
  guiaNumero,
  open,
  onClose,
}: {
  mentoradoId: string;
  guiaNumero: number;
  open: boolean;
  onClose: () => void;
}) => {
  const { data: comentarios = [] } = useRoteiroComentarios(mentoradoId, guiaNumero);
  const marcar = useMarcarComentarioResolvido();
  const arquivar = useDeletarComentario();
  const criar = useCriarComentarioInterno();
  const { user } = useAuth();

  const [replyTo, setReplyTo] = useState<RoteiroComentario | null>(null);
  const [replyTexto, setReplyTexto] = useState("");
  const [replyAudio, setReplyAudio] = useState<{ blob: Blob; url: string; mime: string; duracao: number } | null>(null);
  const [gravando, setGravando] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef<string>("audio/webm");
  const startedAtRef = useRef<number>(0);
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const [activeOrdem, setActiveOrdem] = useState<number | null>(null);

  const { pais, respostasPorPai } = useMemo(() => {
    const pais = comentarios.filter((c) => !c.parent_id);
    const respostasPorPai = new Map<string, RoteiroComentario[]>();
    comentarios
      .filter((c) => !!c.parent_id)
      .forEach((c) => {
        const arr = respostasPorPai.get(c.parent_id!) ?? [];
        arr.push(c);
        respostasPorPai.set(c.parent_id!, arr);
      });
    respostasPorPai.forEach((arr) =>
      arr.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    );
    return { pais, respostasPorPai };
  }, [comentarios]);

  const grupos = useMemo(() => {
    const map = new Map<string, { ordem: number; escopo: string; lista: typeof comentarios }>();
    pais.forEach((c) => {
      const label =
        c.escopo === "headline"
          ? `Headline ${String(c.ordem).padStart(2, "0")}`
          : c.escopo === "estrutura"
          ? `Estrutura ${String(c.ordem).padStart(2, "0")}`
          : `Trecho — bloco ${String(c.ordem).padStart(2, "0")}`;
      const entry = map.get(label) ?? { ordem: c.ordem, escopo: c.escopo, lista: [] as typeof comentarios };
      entry.lista.push(c);
      map.set(label, entry);
    });
    return Array.from(map.entries());
  }, [pais]);

  // Mostrar todos os comentários sempre — apenas destacar o grupo da headline ativa
  const gruposVisiveis = grupos;

  // Acompanhar a headline visível no editor e sincronizar o painel
  useEffect(() => {
    if (!open) return;
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(`[id^="roteiro-${guiaNumero}-"]`)
    );
    if (targets.length === 0) return;

    const visibility = new Map<number, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const id = (e.target as HTMLElement).id;
          const match = id.match(/^roteiro-\d+-(\d+)$/);
          if (!match) return;
          const ord = Number(match[1]);
          visibility.set(ord, e.isIntersecting ? e.intersectionRatio : 0);
        });
        let best: { ord: number; ratio: number } | null = null;
        visibility.forEach((ratio, ord) => {
          if (!best || ratio > best.ratio) best = { ord, ratio };
        });
        if (best && best.ratio > 0) setActiveOrdem(best.ord);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [open, guiaNumero, comentarios.length]);

  // Quando a headline ativa muda, rolar o painel para o grupo correspondente
  useEffect(() => {
    if (activeOrdem == null) return;
    const root = scrollRootRef.current;
    if (!root) return;
    const viewport = root.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]");
    const target = root.querySelector<HTMLElement>(
      `[data-comentarios-ordem="${activeOrdem}"]`
    );
    if (!viewport || !target) return;
    const top = target.offsetTop - 8;
    viewport.scrollTo({ top, behavior: "smooth" });
  }, [activeOrdem, grupos.length]);

  const iniciarGravacao = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const candidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4;codecs=mp4a.40.2",
        "audio/mp4",
      ];
      const mime = candidates.find((c) =>
        typeof MediaRecorder !== "undefined" &&
        (MediaRecorder as unknown as { isTypeSupported?: (t: string) => boolean })
          .isTypeSupported?.(c)
      ) || "";
      mimeRef.current = mime || "audio/webm";
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];
      startedAtRef.current = Date.now();
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeRef.current });
        const duracao = (Date.now() - startedAtRef.current) / 1000;
        stream.getTracks().forEach((t) => t.stop());
        setReplyAudio({ blob, url: URL.createObjectURL(blob), mime: mimeRef.current, duracao });
      };
      mr.start(250);
      setGravando(true);
    } catch {
      toast({ title: "Não foi possível acessar o microfone", variant: "destructive" });
    }
  };

  const pararGravacao = () => {
    mediaRef.current?.stop();
    setGravando(false);
  };

  const enviarResposta = async () => {
    if (!replyTo || !user) return;
    if (!replyTexto.trim() && !replyAudio) {
      toast({ title: "Escreva ou grave algo", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      let audioUrl: string | null = null;
      let duracao: number | null = null;
      if (replyAudio) {
        const ext = replyAudio.mime.includes("mp4") ? "mp4" : "webm";
        const path = `respostas/${mentoradoId}/${guiaNumero}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("roteiro-comentarios-audio")
          .upload(path, replyAudio.blob, { contentType: replyAudio.mime });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage
          .from("roteiro-comentarios-audio")
          .getPublicUrl(path);
        audioUrl = pub.publicUrl;
        duracao = replyAudio.duracao;
      }
      await criar.mutateAsync({
        mentoradoId,
        guiaNumero,
        ordem: replyTo.ordem,
        escopo: replyTo.escopo,
        trecho_texto: null,
        conteudo_texto: replyTexto.trim() || null,
        audio_url: audioUrl,
        audio_duracao_segundos: duracao,
        parent_id: replyTo.id,
        share_id: replyTo.share_id ?? null,
        autor_nome: user.user_metadata?.full_name || user.email || "Mentor",
      });
      setReplyTo(null);
      setReplyTexto("");
      setReplyAudio(null);
      toast({ title: "Resposta enviada" });
    } catch (e: any) {
      toast({ title: "Erro ao enviar", description: e?.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="hidden lg:flex flex-col border-l bg-background shrink-0 overflow-hidden [&_*]:break-words [&_*]:[overflow-wrap:anywhere]"
      style={{ width: 320, fontFamily: "'Poppins', system-ui, sans-serif" }}
    >
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" style={{ color: "#B8860B" }} />
          <p className="font-semibold text-sm">Comentários</p>
          <Badge variant="secondary" className="text-xs">
            {pais.length}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1" ref={scrollRootRef}>
        <div className="p-3 space-y-4">
          {pais.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              Nenhum comentário ainda. Compartilhe a guia para receber comentários.
            </p>
          )}
          {gruposVisiveis.map(([label, grupo]) => (
            <div
              key={label}
              data-comentarios-ordem={grupo.ordem}
              className={
                activeOrdem === grupo.ordem
                  ? "rounded-md ring-1 ring-[#B8860B]/40 bg-[#B8860B]/5 p-2 -m-2"
                  : ""
              }
            >
              <p
                className="text-xs font-semibold mb-2"
                style={{ color: "#B8860B" }}
              >
                {label}
              </p>
              <div className="space-y-2">
                {grupo.lista.map((c) => (
                  <div
                    key={c.id}
                    className={`rounded-md border p-2 text-xs ${
                      c.resolvido ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{c.autor_nome}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(c.created_at).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {c.trecho_texto && (
                      <p className="italic text-[11px] border-l-2 pl-2 my-1 text-muted-foreground">
                        "{c.trecho_texto}"
                      </p>
                    )}
                    {c.conteudo_texto && (
                      <p className="whitespace-pre-wrap">{c.conteudo_texto}</p>
                    )}
                    {c.audio_url && (
                      <div className="mt-1">
                        <AudioPlayer
                          src={c.audio_url}
                          initialDuration={c.audio_duracao_segundos ?? null}
                        />
                      </div>
                    )}

                    {/* Respostas (thread) */}
                    {(respostasPorPai.get(c.id) ?? []).map((r) => (
                      <div
                        key={r.id}
                        className="mt-2 ml-3 border-l-2 pl-2 rounded"
                        style={{ borderColor: "#B8860B" }}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-[11px]">
                            ↳ {r.autor_nome}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(r.created_at).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {r.conteudo_texto && (
                          <p className="whitespace-pre-wrap text-[11px]">{r.conteudo_texto}</p>
                        )}
                        {r.audio_url && (
                          <div className="mt-1">
                            <AudioPlayer
                              src={r.audio_url}
                              initialDuration={r.audio_duracao_segundos ?? null}
                            />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Form de resposta */}
                    {replyTo?.id === c.id && (
                      <div className="mt-2 space-y-1 border-t pt-2">
                        <Textarea
                          value={replyTexto}
                          onChange={(e) => setReplyTexto(e.target.value)}
                          placeholder="Escreva sua resposta..."
                          rows={2}
                          className="text-xs"
                        />
                        <div className="flex items-center gap-1">
                          {!gravando && !replyAudio && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-[10px] gap-1"
                              onClick={iniciarGravacao}
                            >
                              <Mic className="h-3 w-3" /> Áudio
                            </Button>
                          )}
                          {gravando && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-6 px-2 text-[10px] gap-1"
                              onClick={pararGravacao}
                            >
                              <Square className="h-3 w-3" /> Parar
                            </Button>
                          )}
                          {replyAudio && (
                            <div className="flex items-center gap-1 flex-1">
                              <AudioPlayer
                                src={replyAudio.url}
                                initialDuration={replyAudio.duracao}
                                className="flex-1"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => setReplyAudio(null)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          <div className="flex-1" />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[10px]"
                            onClick={() => {
                              setReplyTo(null);
                              setReplyTexto("");
                              setReplyAudio(null);
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            className="h-6 px-2 text-[10px] gap-1"
                            onClick={enviarResposta}
                            disabled={uploading}
                          >
                            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                            Enviar
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-1 mt-1">
                      {replyTo?.id !== c.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => {
                            setReplyTo(c);
                            setReplyTexto("");
                            setReplyAudio(null);
                          }}
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Responder
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[10px]"
                        onClick={() =>
                          marcar.mutate({ id: c.id, resolvido: !c.resolvido })
                        }
                      >
                        <Check className="h-3 w-3 mr-1" />
                        {c.resolvido ? "Reabrir" : "Resolver"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[10px] text-destructive"
                        title="Arquivar (não é apagado)"
                        onClick={() => arquivar.mutate(c.id)}
                      >
                        <Archive className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
